using System.Threading.Tasks;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Dashboard;

namespace DeviceCare.Application.Services
{
    public interface IDashboardService
    {
        Task<Response<DashboardSummaryDto>> GetSummaryAsync(string period);
        void InvalidateCache();
    }
}
