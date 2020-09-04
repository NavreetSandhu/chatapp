const errorMessage = async function (req, res, error) {
    const data = {
        name: error.name,
        category: error.message,
        type: (error.errors[0].type && error.errors[0].type != '') ? error.errors[0].type : '',
        path: (error.errors[0].path && error.errors[0].path != '') ? error.errors[0].path : '',
        value: (error.errors[0].value && error.errors[0].value != '') ? error.errors[0].value : ''
    }
    const message = (error.errors[0].message && error.errors[0].message != '') ? error.errors[0].message : 'System error. Please connect admin.'

    switch (error.name) {
        case 'SequelizeBaseError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeValidationError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeDatabaseError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeTimeoutError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeUniqueConstraintError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeForeignKeyConstraintError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeExclusionConstraintError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeConnectionError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeConnectionRefusedError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeAccessDeniedError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeHostNotReachableError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeInvalidConnectionError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeConnectionTimedOutError':
            await errorData(req, res, message, data);
            break;
        case 'SequelizeInstanceError':
            await errorData(req, res, message, data);
            break;
        default:
            await errorData(req, res, message, data);
            break;
    }
};

const errorData = async function (req, res, message, data) {
    res.status(400).send({
        statusCode: 400,
        data: data,
        message: message
    });
}

module.exports = {
    errorMessage: errorMessage
};