import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    return res
          .status(200)
          .json(new Api_Response(200, [], "Ok"));
})

export {
    healthcheck
    }
    