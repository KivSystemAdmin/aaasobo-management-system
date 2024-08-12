import { RequestWithId } from "../middlewares/parseId.middleware";
import { Response } from "express";
import { fetchInstructorAvailabilitiesTodayAndAfter } from "../services/instructorsAvailabilitiesService";

export const getInstructorAvailabilitiesTodayAndAfter = async (
  req: RequestWithId,
  res: Response,
) => {
  try {
    const today = new Date();
    const data = await fetchInstructorAvailabilitiesTodayAndAfter(
      req.id,
      today,
    );
    return res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getInstructorAvailabilitiesTomorrowAndAfter = async (
  req: RequestWithId,
  res: Response,
) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const data = await fetchInstructorAvailabilitiesTodayAndAfter(
      req.id,
      tomorrow,
    );
    return res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};
