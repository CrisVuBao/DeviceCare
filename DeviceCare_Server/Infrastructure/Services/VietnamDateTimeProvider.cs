using System;
using DeviceCare.Application.Contracts.Services;

namespace DeviceCare.Infrastructure.Services
{
    // Cung cấp thời gian thực theo múi giờ Việt Nam
    public class VietnamDateTimeProvider : IDateTimeProvider
    {
        private static readonly TimeZoneInfo VnTimeZone = 
            TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

        public DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnTimeZone);
        public DateTime UtcNow => DateTime.UtcNow;
    }
}
