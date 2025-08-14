import Joi from "joi";

export const createMessageSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  role: Joi.string().valid("user", "assistant").required(),
  content: Joi.string().min(1).required(),
});
