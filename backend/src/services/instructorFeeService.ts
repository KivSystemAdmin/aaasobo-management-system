import { prisma } from "../../prisma/prismaClient";
import type {
  CreateInstructorFeeRequest,
  InstructorFeeRate,
  InstructorFeeRatesResponse,
} from "../../../shared/schemas/admins";

const JST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export class InstructorFeeError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const formatDateInJst = (date: Date) => {
  const parts = JST_DATE_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format JST date");
  }

  return `${year}-${month}-${day}`;
};

const toDateOnlyUtc = (value: string) => new Date(`${value}T00:00:00.000Z`);

const mapFeeRate = (fee: {
  id: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  trialFee: number;
  regularFee: number;
  cancelFee: number;
  cancelWithoutNoticeFee: number;
}): InstructorFeeRate => ({
  id: fee.id,
  currency: fee.currency,
  effectiveFrom: formatDateInJst(fee.effectiveFrom),
  effectiveTo: fee.effectiveTo ? formatDateInJst(fee.effectiveTo) : null,
  trialFee: fee.trialFee,
  regularFee: fee.regularFee,
  cancelFee: fee.cancelFee,
  cancelWithoutNoticeFee: fee.cancelWithoutNoticeFee,
});

const assertInstructorExists = async (instructorId: number) => {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { id: true },
  });

  if (!instructor) {
    throw new InstructorFeeError(
      404,
      "INSTRUCTOR_NOT_FOUND",
      "Instructor not found",
    );
  }
};

export const getInstructorFees = async (
  instructorId: number,
): Promise<InstructorFeeRatesResponse> => {
  await assertInstructorExists(instructorId);

  const fees = await prisma.instructorFee.findMany({
    where: { instructorId },
    orderBy: [{ effectiveFrom: "desc" }, { id: "desc" }],
  });

  return {
    instructorId,
    fees: fees.map(mapFeeRate),
  };
};

export const createInstructorFee = async (
  instructorId: number,
  data: CreateInstructorFeeRequest,
) => {
  await assertInstructorExists(instructorId);

  const effectiveFrom = toDateOnlyUtc(data.effectiveFrom);

  return await prisma.$transaction(async (tx) => {
    const latestFee = await tx.instructorFee.findFirst({
      where: { instructorId },
      orderBy: [{ effectiveFrom: "desc" }, { id: "desc" }],
    });

    if (
      latestFee &&
      effectiveFrom.getTime() <= latestFee.effectiveFrom.getTime()
    ) {
      throw new InstructorFeeError(
        409,
        "INVALID_EFFECTIVE_FROM",
        "effectiveFrom must be later than the latest fee rate",
      );
    }

    if (latestFee) {
      await tx.instructorFee.update({
        where: { id: latestFee.id },
        data: { effectiveTo: effectiveFrom },
      });
    }

    const createdFee = await tx.instructorFee.create({
      data: {
        instructorId,
        currency: data.currency,
        effectiveFrom,
        effectiveTo: null,
        trialFee: data.trialFee,
        regularFee: data.regularFee,
        cancelFee: data.cancelFee,
        cancelWithoutNoticeFee: data.cancelWithoutNoticeFee,
      },
    });

    return mapFeeRate(createdFee);
  });
};

export const deleteLatestInstructorFee = async (instructorId: number) => {
  await assertInstructorExists(instructorId);

  return await prisma.$transaction(async (tx) => {
    const fees = await tx.instructorFee.findMany({
      where: { instructorId },
      orderBy: [{ effectiveFrom: "desc" }, { id: "desc" }],
      take: 2,
    });

    const [latestFee, previousFee] = fees;

    if (!latestFee || !previousFee) {
      throw new InstructorFeeError(
        409,
        "LATEST_FEE_DELETE_NOT_ALLOWED",
        "At least two fee rates are required to delete the latest rate",
      );
    }

    await tx.instructorFee.delete({
      where: { id: latestFee.id },
    });

    await tx.instructorFee.update({
      where: { id: previousFee.id },
      data: { effectiveTo: null },
    });

    return {
      deletedFeeId: latestFee.id,
      reactivatedFeeId: previousFee.id,
    };
  });
};
