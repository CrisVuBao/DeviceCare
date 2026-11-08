using System.Threading.Tasks;
using DeviceCare.Application.DTOs.Dashboard;

namespace DeviceCare.Application.Contracts.Persistence
{
    public interface IDashboardRepository
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(string period);
    }
}
