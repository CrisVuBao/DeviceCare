using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using DeviceCare.Application.Common;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.DTOs.Dashboard;

namespace DeviceCare.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMemoryCache _memoryCache;

        public DashboardService(IUnitOfWork unitOfWork, IMemoryCache memoryCache)
        {
            _unitOfWork = unitOfWork;
            _memoryCache = memoryCache;
        }

        public async Task<Response<DashboardSummaryDto>> GetSummaryAsync(string period)
        {
            var normalizedPeriod = string.IsNullOrWhiteSpace(period) ? "week" : period.Trim().ToLowerInvariant();
            var cacheKey = $"dashboard_summary_{normalizedPeriod}";

            if (!_memoryCache.TryGetValue(cacheKey, out DashboardSummaryDto? summary) || summary == null)
            {
                summary = await _unitOfWork.Dashboards.GetDashboardSummaryAsync(normalizedPeriod);
                _memoryCache.Set(cacheKey, summary, TimeSpan.FromSeconds(60));
            }

            return Response<DashboardSummaryDto>.SuccessResult("Lấy dữ liệu thống kê thành công", summary);
        }

        public void InvalidateCache()
        {
            _memoryCache.Remove("dashboard_summary_week");
            _memoryCache.Remove("dashboard_summary_month");
            _memoryCache.Remove("dashboard_summary_year");
        }
    }
}
