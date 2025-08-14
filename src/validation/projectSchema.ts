import Joi from "joi";

export const createProjectSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  name: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  status: Joi.string().valid("in_progress", "completed").optional(),
});
