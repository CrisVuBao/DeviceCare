using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Dashboard;
using DeviceCare.Application.Services;

namespace DeviceCare.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Employee")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] string period = "week")
        {
            var result = await _dashboardService.GetSummaryAsync(period);
            if (!result.Success)
            {
                return StatusCode(500, result);
            }
            return Ok(result);
        }
    }
}
