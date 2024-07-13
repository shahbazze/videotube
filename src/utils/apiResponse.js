class Api_Response{
    constructor(statusCode,data,message="success")
    {
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
    }
}

export {Api_Response}