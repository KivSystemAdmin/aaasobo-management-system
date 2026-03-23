import { Response } from "express";
import {
  RequestWithParams,
  RequestWithBody,
  RequestWith,
} from "../middlewares/validationMiddleware";
import {
  registerAdmin,
  getAdminByEmail,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "../services/adminsService";
import {
  getAllInstructorsForAdminList,
  getAllPastInstructorsForAdminList,
  registerInstructor,
  updateInstructor,
  getInstructorByEmail,
  getInstructorByNickname,
  getInstructorByClassURL,
  getInstructorByMeetingId,
  getInstructorByPasscode,
} from "../services/instructorsService";
import {
  getInstructorPayroll,
  InstructorPayrollError,
} from "../services/instructorPayrollService";
import {
  createInstructorFee,
  deleteLatestInstructorFee,
  getInstructorFees,
  InstructorFeeError,
} from "../services/instructorFeeService";
import { getClassesWithinPeriod } from "../services/classesService";
import {
  getAllCustomers,
  getAllPastCustomers,
  deactivateCustomer,
} from "../services/customersService";
import { getAllChildren } from "../services/childrenService";
import {
  getAllPlans,
  registerPlan,
  updatePlan,
  deletePlan,
} from "../services/plansService";
import {
  getAllEvents,
  registerEvent,
  updateEvent,
  deleteEvent,
} from "../services/eventsService";
import { getAllSubscriptions } from "../services/subscriptionsService";
import {
  days,
  convertToISOString,
  convertToTimezoneDate,
  getJstDayRange,
} from "../utils/dateUtils";
import { EVENT_CONFLICT_ITEMS } from "../utils/commonUtils";
import type {
  AdminIdParams,
  ClassListQuery,
  CustomerIdParams,
  InstructorIdParams,
  InstructorPayrollQuery,
  CreateInstructorFeeRequest,
  PlanIdParams,
  EventIdParams,
  RegisterAdminRequest,
  UpdateAdminRequest,
  RegisterInstructorRequest,
  UpdateInstructorRequest,
  RegisterPlanRequest,
  UpdatePlanRequest,
  RegisterEventRequest,
  UpdateEventRequest,
} from "../../../shared/schemas/admins";
import { EnglishBackground } from "../types";

// Register Admin
export const registerAdminController = async (
  req: RequestWithBody<RegisterAdminRequest>,
  res: Response,
) => {
  const { name, email, password } = req.body;

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingAdmin = await getAdminByEmail(normalizedEmail);
    if (existingAdmin) {
      return res.sendStatus(409);
    }

    await registerAdmin({
      name,
      email: normalizedEmail,
      password,
    });

    res.sendStatus(201);
  } catch (error) {
    console.error("Error registering admin", { error });
    res.sendStatus(500);
  }
};

// Update the applicable admin data
export const updateAdminProfileController = async (
  req: RequestWith<AdminIdParams, UpdateAdminRequest>,
  res: Response,
) => {
  const adminId = req.params.id;
  const { name, email } = req.body;

  try {
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if the updated email already exists
    const existingAdmin = await getAdminByEmail(normalizedEmail);
    if (existingAdmin && existingAdmin.id !== adminId) {
      return res.sendStatus(409);
    }

    const admin = await updateAdmin(adminId, name, email);

    res.status(200).json({
      message: "Admin is updated successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

export const deleteAdminController = async (
  req: RequestWithParams<AdminIdParams>,
  res: Response,
) => {
  const adminId = req.params.id;

  try {
    const deletedAdmin = await deleteAdmin(adminId);

    res.status(200).json({
      message: "The admin profile was deleted successfully",
      id: deletedAdmin.id,
    });
  } catch (error) {
    console.error("Failed to delete the admin profile:", error);
    res.status(500).json({ error: "Failed to delete the admin profile." });
  }
};

export const deactivateCustomerController = async (
  req: RequestWithParams<CustomerIdParams>,
  res: Response,
) => {
  const customerId = req.params.id;

  try {
    // Deactivate (soft delete) the customer and children data by masking their profiles
    const deactivatedUsers = await deactivateCustomer(customerId);

    res.status(200).json({
      message: "The users were deactivated successfully",
      users: deactivatedUsers,
    });
  } catch (error) {
    console.error("Failed to deactivate the customer:", error);
    res.status(500).json({ error: "Failed to deactivate the customer." });
  }
};

interface Subscription {
  id: number;
  planId: number;
  customerId: number;
  startAt: Date;
  endAt: Date | null;
  plan: {
    id: number;
    name: string;
  };
  customer: {
    id: number;
    name: string;
    email: string;
    password: string;
    children: {
      id: number;
      customerId: number;
      name: string;
    }[];
  };
}

interface SingleChildSubscription extends Omit<Subscription, "customer"> {
  customer: Omit<Subscription["customer"], "children"> & {
    children: {
      id: number;
      customerId: number;
      name: string;
    };
  };
}

function setErrorResponse(res: Response, error: unknown) {
  return res
    .status(500)
    .json({ message: error instanceof Error ? error.message : `${error}` });
}

export const getAdminController = async (
  req: RequestWithParams<AdminIdParams>,
  res: Response,
) => {
  const id = req.params.id;
  try {
    const admin = await getAdminById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }
    return res.status(200).json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    return setErrorResponse(res, error);
  }
};

// Displaying admins' information for admin dashboard
export const getAllAdminsController = async (_: Request, res: Response) => {
  try {
    // Fetch the admin data using the email.
    const admins = await getAllAdmins();

    // Transform the data structure.
    const data = admins.map((admin, number) => {
      const { id, name, email } = admin;

      return {
        No: number + 1,
        ID: id,
        Admin: name,
        Email: email,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Displaying customers' information for admin dashboard
export const getAllCustomersController = async (_: Request, res: Response) => {
  try {
    // Fetch all customers data using the email.
    const customers = await getAllCustomers();

    // Transform the data structure.
    const data = customers.map((customer, number) => {
      let { id, name, email, prefecture, children } = customer;

      // Format children names as a comma-separated string
      const childrenNames = children.map((child) => child.name).join(", ");

      return {
        No: number + 1,
        ID: id,
        Customer: name,
        Children: childrenNames,
        Email: email,
        Prefecture: prefecture,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Displaying past customers' information for admin dashboard
export const getAllPastCustomersController = async (
  _: Request,
  res: Response,
) => {
  try {
    // Fetch all past customers data using the email.
    const customers = await getAllPastCustomers();

    // Transform the data structure.
    const data = customers.map((customer, number) => {
      let { id, name, children, terminationAt } = customer;

      // Format children names as a comma-separated string
      const childrenNames = children.map((child) => child.name).join(", ");

      // Convert termination date to Japanese date format (YYYY-MM-DD)
      let formattedTerminationDate = "";
      if (terminationAt) {
        formattedTerminationDate = convertToTimezoneDate(
          terminationAt,
          "Asia/Tokyo",
        )
          .toISOString()
          .slice(0, 10);
      }

      return {
        No: number + 1,
        ID: id,
        "Past Customer": name,
        "Past Children": childrenNames,
        "End Date (JST)": formattedTerminationDate,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Displaying instructors' information for admin dashboard
export const getAllInstructorsController = async (
  _: Request,
  res: Response,
) => {
  try {
    // Fetch the instructors data using the email.
    const instructors = await getAllInstructorsForAdminList();

    // Transform the data structure.
    const data = instructors.map((instructor, number) => {
      const { id, name, nickname, email } = instructor;
      const englishBackgroundLabel: Record<EnglishBackground, string> = {
        [EnglishBackground.NonNative]: "Non-Native",
        [EnglishBackground.NativeA]: "Native A",
        [EnglishBackground.NativeB]: "Native B",
      };

      return {
        No: number + 1,
        ID: id,
        Instructor: nickname,
        English:
          englishBackgroundLabel[
            instructor.englishBackground as EnglishBackground
          ],
        "Full Name": name,
        Email: email,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getInstructorPayrollController = async (
  req: RequestWith<InstructorIdParams, never, InstructorPayrollQuery>,
  res: Response,
) => {
  try {
    const payroll = await getInstructorPayroll(req.params.id, req.query.month);
    return res.status(200).json(payroll);
  } catch (error) {
    if (error instanceof InstructorPayrollError) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }

      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      });
    }

    console.error("Failed to fetch instructor payroll", {
      error,
      instructorId: req.params.id,
      month: req.query.month,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getInstructorFeesController = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  try {
    const fees = await getInstructorFees(req.params.id);
    return res.status(200).json(fees);
  } catch (error) {
    if (error instanceof InstructorFeeError) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      });
    }

    console.error("Failed to fetch instructor fees", {
      error,
      instructorId: req.params.id,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createInstructorFeeController = async (
  req: RequestWith<InstructorIdParams, CreateInstructorFeeRequest>,
  res: Response,
) => {
  try {
    const fee = await createInstructorFee(req.params.id, req.body);
    return res.status(201).json({
      message: "Instructor fee rate created successfully",
      fee,
    });
  } catch (error) {
    if (error instanceof InstructorFeeError) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      });
    }

    console.error("Failed to create instructor fee", {
      error,
      instructorId: req.params.id,
      body: req.body,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteLatestInstructorFeeController = async (
  req: RequestWithParams<InstructorIdParams>,
  res: Response,
) => {
  try {
    const result = await deleteLatestInstructorFee(req.params.id);
    return res.status(200).json({
      message: "Latest instructor fee rate deleted successfully",
      ...result,
    });
  } catch (error) {
    if (error instanceof InstructorFeeError) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      });
    }

    console.error("Failed to delete latest instructor fee", {
      error,
      instructorId: req.params.id,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Displaying past instructors' information for admin dashboard
export const getAllPastInstructorsController = async (
  _: Request,
  res: Response,
) => {
  try {
    // Fetch the instructors data using the email.
    const instructors = await getAllPastInstructorsForAdminList();

    // Transform the data structure.
    const data = instructors.map((instructor, number) => {
      const { id, nickname, terminationAt } = instructor;

      // Convert termination date to Japanese date format (YYYY-MM-DD)
      let formattedTerminationDate = "";
      if (terminationAt) {
        formattedTerminationDate = convertToTimezoneDate(
          terminationAt,
          "Asia/Tokyo",
        )
          .toISOString()
          .slice(0, 10);
      }

      return {
        No: number + 1,
        ID: id,
        "Past Instructor": nickname,
        "End Date (JST)": formattedTerminationDate,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Register instructor by admin
export const registerInstructorController = async (
  req: RequestWithBody<RegisterInstructorRequest>,
  res: Response,
) => {
  const icon = req.file;
  const {
    name,
    nickname,
    email,
    password,
    birthdate,
    lifeHistory,
    favoriteFood,
    hobby,
    messageForChildren,
    workingTime,
    skill,
    classURL,
    meetingId,
    passcode,
    englishBackground,
  } = req.body;

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();
  // Normalize birthdate
  const normalizedBirthdate = new Date(convertToISOString(birthdate));
  // Convert englishBackground to number
  const englishBackgroundNum = Number(englishBackground);

  // Set unique checks list
  const uniqueChecks = [
    { fn: getInstructorByNickname, value: nickname },
    { fn: getInstructorByEmail, value: normalizedEmail },
    { fn: getInstructorByClassURL, value: classURL },
    { fn: getInstructorByMeetingId, value: meetingId },
    { fn: getInstructorByPasscode, value: passcode },
  ];
  let errorItems = "";

  try {
    const results = await Promise.all(
      uniqueChecks.map(({ fn, value }) => fn(value)),
    );

    const [
      nicknameExists,
      emailExists,
      classURLExists,
      meetingIdExists,
      passcodeExists,
    ] = results;

    // Make list of error items and set the text including each error item
    if (nicknameExists) errorItems = errorItems.concat(", ", "Nickname");
    if (emailExists) errorItems = errorItems.concat(", ", "Email");
    if (classURLExists) errorItems = errorItems.concat(", ", "Class URL");
    if (meetingIdExists) errorItems = errorItems.concat(", ", "Meeting ID");
    if (passcodeExists) errorItems = errorItems.concat(", ", "Pass Code");

    // Count the number of commas in the errorItems string
    const errorItemCount = (errorItems.match(/,/g) || []).length;

    if (errorItemCount > 0) {
      // Remove the first comma and space from the errorItems string
      errorItems = errorItems.substring(2);
      // Return error items
      return res.status(409).json({ items: errorItems });
    }

    await registerInstructor({
      name,
      nickname,
      email: normalizedEmail,
      password,
      icon,
      birthdate: normalizedBirthdate,
      lifeHistory,
      favoriteFood,
      hobby,
      messageForChildren,
      workingTime,
      skill,
      classURL,
      meetingId,
      passcode,
      englishBackground: englishBackgroundNum,
    });

    res.sendStatus(201);
  } catch (error) {
    console.error("Error registering instructor", { error });
    res.sendStatus(500);
  }
};

// Update the applicable instructor data
export const updateInstructorProfileController = async (
  req: RequestWith<InstructorIdParams, UpdateInstructorRequest>,
  res: Response,
) => {
  const id = req.params.id;
  const icon = req.file;
  const {
    name,
    leavingDate,
    email,
    nickname,
    birthdate,
    workingTime,
    lifeHistory,
    favoriteFood,
    hobby,
    messageForChildren,
    skill,
    classURL,
    meetingId,
    passcode,
    englishBackground,
  } = req.body;

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();
  // Normalize leavingDate and birthdate
  const normalizedLeavingDate =
    leavingDate && leavingDate !== "null"
      ? new Date(convertToISOString(leavingDate))
      : null;
  const normalizedBirthdate = new Date(convertToISOString(birthdate));
  // Convert englishBackground to number
  const englishBackgroundNum = Number(englishBackground);

  // Set unique checks list
  const uniqueChecks = [
    { fn: getInstructorByNickname, value: nickname },
    { fn: getInstructorByEmail, value: normalizedEmail },
    { fn: getInstructorByClassURL, value: classURL },
    { fn: getInstructorByMeetingId, value: meetingId },
    { fn: getInstructorByPasscode, value: passcode },
  ];
  let errorItems: { [key: string]: string } = {};

  try {
    const results = await Promise.all(
      uniqueChecks.map(({ fn, value }) => fn(value)),
    );

    const [
      nicknameExists,
      emailExists,
      classURLExists,
      meetingIdExists,
      passcodeExists,
    ] = results;

    if (nicknameExists && nicknameExists.id !== id) {
      errorItems.nickname = "The nickname is already in use.";
    }
    if (emailExists && emailExists.id !== id) {
      errorItems.email = "The email is already in use.";
    }
    if (classURLExists && classURLExists.id !== id) {
      errorItems.classURL = "The class URL is already in use.";
    }
    if (meetingIdExists && meetingIdExists.id !== id) {
      errorItems.meetingId = "The meeting ID is already in use.";
    }
    if (passcodeExists && passcodeExists.id !== id) {
      errorItems.passcode = "The passcode is already in use.";
    }
    if (Object.keys(errorItems).length > 0) {
      return res.status(400).json(errorItems);
    }

    const instructor = await updateInstructor(
      id,
      icon,
      name,
      nickname,
      normalizedLeavingDate,
      normalizedBirthdate,
      workingTime,
      lifeHistory,
      favoriteFood,
      hobby,
      messageForChildren,
      skill,
      email,
      classURL,
      meetingId,
      passcode,
      englishBackgroundNum,
    );

    // Create a new instructor object with the updated termination date (JST).
    // This is because the termination date needs to be in UTC format on the database.
    // The calculation will convert the date from JST to UTC in updateInstructor().
    const updatedInstructor = {
      ...instructor,
      terminationAt: normalizedLeavingDate,
    };

    res.status(200).json({
      message: "Instructor is updated successfully",
      instructor: updatedInstructor,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// Displaying children's information for admin dashboard
export const getAllChildrenController = async (_: Request, res: Response) => {
  try {
    // Fetch all children data using the email.
    const children = await getAllChildren();

    // Transform the data structure.
    const data = children.map((child, number) => {
      let { id, name, customer, birthdate, personalInfo } = child;
      let displayedBirthdate = birthdate?.toISOString().slice(0, 10);

      return {
        No: number + 1,
        ID: id,
        Child: name,
        "Customer ID": customer.id,
        Customer: customer.name,
        Birthdate: displayedBirthdate,
        "Personal Info": personalInfo,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Displaying all plans' information for admin dashboard
export const getAllSubscriptionsController = async (
  _: Request,
  res: Response,
) => {
  try {
    // Fetch all subscriptions data
    const subscriptions = await getAllSubscriptions();

    // Transform the data structure
    const data = subscriptions.reduce((acc, subscription) => {
      const { plan, customer, endAt } = subscription;
      let { id: customerId, name: customerName } = customer;
      const { name: planName, terminationAt: planTerminationAt } = plan;

      let comment = "";
      const now = new Date();

      // Skip if the plan has been deleted
      if (!plan) {
        return acc;
      }

      // Skip if the subscription has ended
      if (endAt && endAt < now) {
        return acc;
      }

      // Skip if the plan has ended before the subscription
      if (planTerminationAt) {
        if (endAt && endAt < planTerminationAt) {
          return acc;
        } else {
          comment = "Delete this subscription (plan no longer exists)";
        }
      }

      acc.push({
        No: acc.length + 1,
        ID: customerId,
        Customer: customerName,
        "Subscription Plan": planName,
        Note: comment,
      });

      return acc;
    }, [] as any[]);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Displaying all plans' information for admin dashboard
export const getAllPlansController = async (_: Request, res: Response) => {
  try {
    // Fetch all plans data.
    const plans = await getAllPlans();

    // Transform the data structure.
    const data = plans.map((plan, number) => {
      const { id, name, weeklyClassTimes, description, englishBackground } =
        plan;
      const [planNameJpn, planNameEng] = name.split(" / ");
      const englishBackgroundLabel: Record<EnglishBackground, string> = {
        [EnglishBackground.NonNative]: "Non-Native",
        [EnglishBackground.NativeA]: "Native A",
        [EnglishBackground.NativeB]: "Native B",
      };

      return {
        No: number + 1,
        ID: id,
        "Plan (Japanese)": planNameJpn,
        "Plan (English)": planNameEng,
        English: englishBackgroundLabel[englishBackground as EnglishBackground],
        "Weekly Class Times": weeklyClassTimes,
        Description: description,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Register a new plan
export const registerPlanController = async (
  req: RequestWithBody<RegisterPlanRequest>,
  res: Response,
) => {
  const {
    planNameEng,
    planNameJpn,
    weeklyClassTimes,
    description,
    englishBackground,
  } = req.body;

  // Combine Japanese and English names into the required format
  const name = `${planNameJpn} / ${planNameEng}`;
  // Convert englishBackground to number
  const englishBackgroundNum = Number(englishBackground);

  try {
    await registerPlan({
      name,
      weeklyClassTimes,
      description,
      englishBackground: englishBackgroundNum,
    });

    res.sendStatus(201);
  } catch (error) {
    console.error("Error registering a new plan", { error });
    res.sendStatus(500);
  }
};

// Delete the selected plan
export const deletePlanController = async (
  req: RequestWithParams<PlanIdParams>,
  res: Response,
) => {
  const planId = req.params.id;

  try {
    const deletedPlan = await deletePlan(planId);

    res.status(200).json({
      message: "The plan was deleted successfully",
      id: deletedPlan.id,
    });
  } catch (error) {
    console.error("Failed to delete the plan:", error);
    res.status(500).json({ error: "Failed to delete the plan." });
  }
};

// Update the applicable plan data
export const updatePlanController = async (
  req: RequestWith<PlanIdParams, UpdatePlanRequest>,
  res: Response,
) => {
  const planId = req.params.id;
  const body = req.body;

  try {
    if (
      !body.planNameEng ||
      !body.planNameJpn ||
      !body.description ||
      typeof body.englishBackground !== "number"
    ) {
      return res
        .status(400)
        .json({ message: "Name and description are required for update" });
    }
    const { planNameEng, planNameJpn, description, englishBackground } = body;

    // Combine Japanese and English names into the required format
    const name = `${planNameJpn} / ${planNameEng}`;
    // Convert englishBackground to number
    const englishBackgroundNum = Number(englishBackground);

    const updatedPlan = await updatePlan(
      planId,
      name,
      description,
      englishBackgroundNum,
    );
    return res.status(200).json({
      message: "Plan is updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// Displaying all events' information for admin dashboard
export const getAllEventsController = async (_: Request, res: Response) => {
  try {
    // Fetch all events data.
    const events = await getAllEvents();

    // Transform the data structure.
    const data = events.map((event, number) => {
      const { id, name, color } = event;
      const [eventNameJpn, eventNameEng] = name.split(" / ");

      return {
        No: number + 1,
        ID: id,
        Event: name,
        "Event (Japanese)": eventNameJpn,
        "Event (English)": eventNameEng,
        "Color Code": color,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};

// Register a new event
export const registerEventController = async (
  req: RequestWithBody<RegisterEventRequest>,
  res: Response,
) => {
  const { eventNameJpn, eventNameEng, color } = req.body;

  // Normalize the event name and color code
  const normalizedEventNameJpn = eventNameJpn.toLowerCase().replace(/\s/g, "");
  const normalizedEventNameEng = eventNameEng.toLowerCase().replace(/\s/g, "");
  const normalizedColorCode = color.toLowerCase().replace(/\s/g, "");

  try {
    // Check if the event with the same name and color already exists
    const existingEvents = await getAllEvents();

    const eventNameJpnExists = existingEvents.some(
      (event) =>
        event.name.toLowerCase().split(" / ")[0].trim() ===
        normalizedEventNameJpn,
    );
    const eventNameEngExists = existingEvents.some(
      (event) =>
        event.name.toLowerCase().split(" / ")[1].trim() ===
        normalizedEventNameEng,
    );
    const eventColorExists = existingEvents.some(
      (event) =>
        event.color.toLowerCase().replace(/\s/g, "") === normalizedColorCode,
    );

    // Collect conflict reasons
    const conflictItems: string[] = [];
    eventNameJpnExists ? conflictItems.push(EVENT_CONFLICT_ITEMS[0]) : null;
    eventNameEngExists ? conflictItems.push(EVENT_CONFLICT_ITEMS[1]) : null;
    eventColorExists ? conflictItems.push(EVENT_CONFLICT_ITEMS[2]) : null;
    if (conflictItems.length > 0) {
      return res.status(409).json({ items: conflictItems });
    }

    // Combine Japanese and English names into the required format
    const name = `${eventNameJpn} / ${eventNameEng}`;

    // Register the new event
    await registerEvent({
      name,
      color: normalizedColorCode,
    });

    res.sendStatus(201);
  } catch (error) {
    console.error("Error registering a new event", { error });
    res.sendStatus(500);
  }
};

// Update the applicable event data
export const updateEventProfileController = async (
  req: RequestWith<EventIdParams, UpdateEventRequest>,
  res: Response,
) => {
  const eventId = req.params.id;
  const { eventNameJpn, eventNameEng, color } = req.body;

  // Normalize the event name and color code
  const normalizedEventNameJpn = eventNameJpn.toLowerCase().replace(/\s/g, "");
  const normalizedEventNameEng = eventNameEng.toLowerCase().replace(/\s/g, "");
  const normalizedColorCode = color.toLowerCase().replace(/\s/g, "");

  try {
    // Check if the event with the same name and color already exists
    const existingEvents = await getAllEvents();

    // Exclude the current event from the existing events for conflict check
    const filteredEvents = existingEvents.filter(
      (event) => event.id !== eventId,
    );
    const eventNameJpnExists = filteredEvents.some(
      (event) =>
        event.name.toLowerCase().split(" / ")[0].trim() ===
        normalizedEventNameJpn,
    );
    const eventNameEngExists = filteredEvents.some(
      (event) =>
        event.name.toLowerCase().split(" / ")[1].trim() ===
        normalizedEventNameEng,
    );
    const eventColorExists = filteredEvents.some(
      (event) =>
        event.color.toLowerCase().replace(/\s/g, "") === normalizedColorCode,
    );

    // Collect conflict reasons
    const conflictItems: string[] = [];
    eventNameJpnExists ? conflictItems.push(EVENT_CONFLICT_ITEMS[0]) : null;
    eventNameEngExists ? conflictItems.push(EVENT_CONFLICT_ITEMS[1]) : null;
    eventColorExists ? conflictItems.push(EVENT_CONFLICT_ITEMS[2]) : null;

    if (conflictItems.length > 0) {
      return res.status(409).json({ items: conflictItems });
    }

    // Combine Japanese and English names into the required format
    const name = `${eventNameJpn} / ${eventNameEng}`;

    const event = await updateEvent(eventId, name, normalizedColorCode);

    res.status(200).json({
      message: "Event is updated successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({ error: `${error}` });
  }
};

// Delete the selected event
export const deleteEventController = async (
  req: RequestWithParams<EventIdParams>,
  res: Response,
) => {
  const eventId = req.params.id;

  try {
    const deletedEvent = await deleteEvent(eventId);

    res.status(200).json({
      message: "The event was deleted successfully",
      id: deletedEvent.id,
    });
  } catch (error) {
    console.error("Failed to delete the event:", error);
    res.status(500).json({ error: "Failed to delete the event." });
  }
};

// Get class information within designated period
export const getClassesWithinPeriodController = async (
  req: RequestWith<never, never, ClassListQuery>,
  res: Response,
) => {
  try {
    const shouldFetchTodayOnly = req.query.today;
    let designatedPeriodBefore: Date;
    let designatedPeriodAfter: Date;

    if (shouldFetchTodayOnly) {
      const { startOfDay, endOfDay } = getJstDayRange(new Date());
      designatedPeriodBefore = startOfDay;
      designatedPeriodAfter = endOfDay;
    } else {
      // Fetch class data within designated period (31days).
      const designatedPeriod = 31;
      designatedPeriodBefore = new Date(
        Date.now() - designatedPeriod * (24 * 60 * 60 * 1000),
      );
      designatedPeriodAfter = new Date(
        Date.now() + (designatedPeriod + 1) * (24 * 60 * 60 * 1000),
      );
      // Set the designated period to 31 days converted to "T00:00:00.000Z".
      designatedPeriodBefore.setUTCHours(0, 0, 0, 0);
      designatedPeriodAfter.setUTCHours(0, 0, 0, 0);
    }

    const classes = await getClassesWithinPeriod(
      designatedPeriodBefore,
      designatedPeriodAfter,
    );

    // Transform the data structure.
    const data = classes.map((classItem, number) => {
      const {
        id,
        instructor,
        customer,
        dateTime,
        status,
        classCode,
        classAttendance,
      } = classItem;

      // If the free trial class status is "pending" or "declined" before booking, an instructor is not assigned — return "Not Set".
      const instructorName = instructor?.nickname ?? "Not Set";
      let customerName = customer.name;

      // If the free trial class status is "pending" or "declined" before booking, no dateTime is selected — return "Not Set".
      let date = "Not Set";
      let time = "Not Set";

      if (dateTime) {
        // Convert dateTime from UTC to JST (Add 9 hours).
        const dateTimeUTC = new Date(dateTime);
        const dateTimeJST = new Date(
          dateTimeUTC.getTime() + 9 * 60 * 60 * 1000,
        );

        date = dateTimeJST.toISOString().slice(0, 10);
        time = dateTimeJST.toISOString().slice(11, 16);
      }

      // Calculate the day of the week in JST
      let dayOfWeekStr = "";
      if (date !== "Not Set") {
        const dayOfWeekJST = new Date(date);
        const daysOfWeek = days;
        dayOfWeekStr = daysOfWeek[dayOfWeekJST.getDay()];
      }

      // Format the displayed status.
      let statusText = "";
      switch (status) {
        case "booked":
          statusText = "Booked";
          break;
        case "completed":
          statusText = "Completed";
          break;
        case "canceledByCustomer":
          statusText = "Canceled(Customer)";
          break;
        case "canceledByInstructor":
          statusText = "Canceled(Instructor)";
          break;
        case "rebooked":
          statusText = "Rebooked";
          break;
        case "pending":
          statusText = "Pending";
          break;
        case "declined":
          statusText = "Declined";
          break;
      }

      return {
        No: number + 1,
        ID: id,
        "Date/Time (JST)": date ? `${date} ${time}` : "Not Set",
        Day: dayOfWeekStr,
        Instructor: instructorName,
        InstructorID: instructor?.id ?? null,
        Children: classAttendance
          .map((attendance) => attendance.children.name)
          .join(", "),
        Customer: customerName,
        CustomerID: customer.id,
        Status: statusText,
        "Class Code": classCode,
      };
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
};
