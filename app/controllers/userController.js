const UserModel = require("../models/Users");
const AppResponse = require("../services/AppResponse");
const axios = require('axios');
const pug = require('pug');

const createUser = async (req, res) => {
  try {
    const payload = req.body.user;
    const user = await UserModel.create(payload)
    return AppResponse.success(res, user)
  } catch (error) {
    if(error.message.includes('E11000 duplicate key error collection')) {
      return AppResponse.conflict(
        res,
        'User with user name already exists',
        error.message
      )
    } else if (error.name = 'ValidationError') {
      return AppResponse.badRequest(
        res,
        'Invalid Payload',
        error.message
      )
    } else {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
  }
};

const getUsers = async (req, res) => {
    try {
      const { role, currentUserName } = req.query;
      let users = await UserModel.find();
      if(role) {
        users = users.filter(user =>  user.role === role && user.userName !== currentUserName)
      }
      return AppResponse.success(res, {users})
    } catch (error) {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
};

const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const users = await UserModel.findById(id);
    return AppResponse.success(res, {users})
  } catch (error) {
    return AppResponse.error(
      res,
      'INTERNAL SERVER ERROR',
      error.message
    )
  }
};

const login = async (req, res) => {
  try {
    const user = req.body.user;
    if(!user.userName || !user.password) {
      return AppResponse.badRequest(
        res,
        'MISSING_REQUIRED_FIELDS',
        'MISSING_REQUIRED_FIELDS' 
      )
    }
    // check if the user present and compare the password
    const userDetails = await UserModel.findOne({userName: user.userName});
    if(!userDetails) {
      return AppResponse.notFound(
        res,
        'USER NOT FOUND',
        'USER NOT FOUND' 
      )
    } else if (userDetails.password !== user.password) {
      return AppResponse.badRequest(
        res,
        'INVALID_PASSWORD',
        'INVALID_PASSWORD' 
      )
    }
    return AppResponse.success(res, {user: userDetails});
  } catch (error) {
    return AppResponse.error(
      res,
      'INTERNAL SERVER ERROR',
      error.message
    )
  }
}

const deleteUserByAdmin = async (req, res) => {
    try {
      // get user by Id
      const { id } = req.params;
      const userDetails = await UserModel.findOne({_id: id});
      if(!userDetails) {
        return AppResponse.notFound(
          res,
          'USER NOT FOUND',
          'USER NOT FOUND' 
        )
      }
      // delete user
      const user = await UserModel.findByIdAndDelete(id);
      return AppResponse.success(res, {user})
    } catch (error) {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
};

const resetPassword = async (req, res) => {
  try {
    const user = req.body.user;
    if(!user.email || !user.password || !user.confirmPassword) {
      return AppResponse.badRequest(
        res,
        'MISSING_REQUIRED_FIELDS',
        'MISSING_REQUIRED_FIELDS' 
      )
    } else if (user.password !== user.confirmPassword) {
      return AppResponse.badRequest(
        res,
        'PASSWORD_DOES_NOT_MATCH',
        'PASSWORD_DOES_NOT_MATCH' 
      )
    }

    // check if user exists with provided email in the platform
    const userInfo = await UserModel.findOne({email: user.email});
    if(!userInfo) {
      return AppResponse.notFound(
        res,
        'USER NOT FOUND',
        'USER NOT FOUND' 
      )
    }

    await UserModel.updateOne({email: userInfo.email}, {
      $set: {
        password: user.password
      }
    })

    return AppResponse.success(res, {})
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const forgotPassword = async (req, res) => {
  try {
    const user = req.body.user;
    if(!user.email) {
      return AppResponse.badRequest(
        res,
        'MISSING_REQUIRED_FIELDS',
        'MISSING_REQUIRED_FIELDS' 
      )
    }
    // check if user exists with provided email in the platform
    const userInfo = await UserModel.findOne({email: user.email});
    if(!userInfo) {
      return AppResponse.notFound(
        res,
        'USER NOT FOUND',
        'USER NOT FOUND' 
      )
    }

    const metaData = {
      name: userInfo.userName,
      email: userInfo.email,
      url: `http://localhost:${process.env.PORT}/reset-password?email=${userInfo.email}`
    }

    console.log('before template creation', metaData);
    const html = await renderNotificationTemplate('app/template/password_rest_template.pug',
      metaData, 10, 10);
    console.log('after template creation', html);
    // send the reset password email for the user
    await sendResetPasswordEmail(user.email, 'Your Reset Password Request', html);

    return AppResponse.success(res, {})
  } catch (error) {
    console.log(error);
    throw error;
  }
}


const renderNotificationTemplate = async (templatePath, data,
      delay, times) => {
    const html = await pug.renderFile(templatePath, data);
    if (!html || !html.trim()) {
        if (times - 1) {
          return this.wait(delay)
            .then(() => {
              return this.renderNotificationTemplate(templatePath, data, delay, times - 1);
            })
            .catch((err) => {
              Logger.error(err);
            });
        } else {
          const fileRenderError =
            new Error(`Failed to render html template:: ${templatePath} for email:: ${data.email}`);
          console.log(fileRenderError);
          return null;
        }
    } else {
      return html;
    }
}

const sendResetPasswordEmail = async (to, subject, html) => {
  try {
    const url = process.env.SENDGRID_URL;
        const options = {
            headers: {
                'content-type': 'application/json',
                'authorization': 'Bearer' + ' ' + process.env.SENDGRID_APIKEY,
            },
        };

        const data = {
            personalizations: [
                {
                    to: [
                        {
                            email: to,
                        },
                    ],
                    subject,
                },
            ],
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME,
            },
            content: [
                {
                    type: 'text/html',
                    value: html,
                },
            ],
        };

        return axios.post(url, data, options);
  } catch (error) {
     console.log(error);
  }
}

module.exports = {
  createUser,
  getUsers,
  login,
  deleteUserByAdmin,
  getUserById,
  forgotPassword,
  resetPassword,
};
