const Joi = require('joi');

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message).join('; ');
      return res.status(400).json({ success: false, error: messages });
    }
    req.body = value;
    next();
  };
}

const schemas = {
  createProject: Joi.object({
    id: Joi.string().optional(),
    projectCode: Joi.string().optional(),
    projectName: Joi.string().optional(),
    dDay: Joi.string().isoDate().optional(),
    advanceDays: Joi.number().integer().min(1).optional(),
    advanceNoticeDays: Joi.number().integer().min(1).optional(),
    ownerName: Joi.string().allow('', null).optional(),
    ownerEmail: Joi.string().email().allow('', null).optional(),
    projectOwners: Joi.array().optional(),
    teamsWebhookUrl: Joi.string().allow('', null).optional(),
    rules: Joi.array().optional()
  }).or('projectName', 'projectCode', 'id'),

  createUser: Joi.object({
    email: Joi.string().email().required().messages({ 'any.required': 'Email為必填欄位', 'string.email': 'Email格式不正確' }),
    name: Joi.string().required().messages({ 'any.required': '姓名為必填欄位' }),
    password: Joi.string().min(3).optional(),
    role: Joi.string().optional(),
    department: Joi.string().allow('', null).optional(),
    title: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  }),

  // Whitelisted updateUser fields to fix Mass Assignment vulnerability
  updateUser: Joi.object({
    name: Joi.string().optional(),
    department: Joi.string().allow('', null).optional(),
    title: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    role: Joi.string().optional()
  }),

  createRole: Joi.object({
    name: Joi.string().required().messages({ 'any.required': '角色名稱為必填欄位' }),
    description: Joi.string().allow('', null).optional(),
    permissions: Joi.array().items(Joi.string()).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  senderLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required(),
    name: Joi.string().allow('', null).optional()
  })
};

module.exports = {
  validateBody,
  schemas
};
