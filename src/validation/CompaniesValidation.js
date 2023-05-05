import Joi from "joi";

// Joi validator for created schema
export function validateCompanies(_reqBody) {
  let joiSchema = Joi.object({
    title: Joi.string().min(2).max(150).required(),
    address: Joi.string().min(2).max(150).required(),
    location: Joi.string().min(2).max(150).required(),
    image: Joi.string().min(1).max(150).allow(null, ""),
    company: Joi.string().min(1).max(150).required(),
  });

  return joiSchema.validate(_reqBody);
}
