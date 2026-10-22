using System;

namespace DeviceCare.Application.Contracts.Services
{
    // Thời gian hệ thống đồng nhất
    public interface IDateTimeProvider
    {
        DateTime Now { get; }
        DateTime UtcNow { get; }
    }
}
