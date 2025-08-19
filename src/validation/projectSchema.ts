import Joi from "joi";

export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  status: Joi.string().valid("In Progress", "Completed").optional(),
});
