namespace DeviceCare.Application.Common
{
    public class Response<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }

        public static Response<T> SuccessResult(string message, T data)
        {
            return new Response<T> { Success = true, Message = message, Data = data };
        }

        public static Response<T> Failure(string errorMessage)
        {
            return new Response<T> { Success = false, Message = errorMessage };
        }
    }
}
