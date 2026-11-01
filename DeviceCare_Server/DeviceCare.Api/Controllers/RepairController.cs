using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Repair;
using DeviceCare.Application.Services;

namespace DeviceCare.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RepairController : ControllerBase
    {
        private readonly IRepairService _repairService;

        public RepairController(IRepairService repairService)
        {
            _repairService = repairService;
        }

        private int? GetCurrentUserId()
        {
            var strId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(strId, out int id)) return id;
            return null;
        }

        private int? GetCurrentEmployeeId()
        {
            var strId = User.FindFirstValue("employeeId");
            if (int.TryParse(strId, out int id)) return id;
            return null;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRepair([FromBody] CreateRepairDto model)
        {
            if (!ModelState.IsValid) return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));

            var result = await _repairService.CreateRepairAsync(model, GetCurrentEmployeeId(), GetCurrentUserId());
            if (!result.Success) return BadRequest(result);

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRepairs([FromQuery] string? status, [FromQuery] string? search)
        {
            var result = await _repairService.GetAllRepairsAsync(status, search);
            return Ok(result);
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPagedRepairs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            var result = await _repairService.GetPagedRepairsAsync(page, pageSize, status, search);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRepairDetail(int id)
        {
            var result = await _repairService.GetRepairDetailDtoAsync(id);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRepair(int id, [FromBody] UpdateRepairDto model)
        {
            if (!ModelState.IsValid) return BadRequest(Response<string>.Failure("Dữ liệu không hợp lệ"));

            var result = await _repairService.UpdateRepairAsync(id, model);
            if (!result.Success) return NotFound(result);

            return Ok(result);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto model)
        {
            if (!ModelState.IsValid) return BadRequest(Response<string>.Failure("Dữ liệu không hợp lệ"));

            var result = await _repairService.UpdateStatusAsync(id, model, GetCurrentUserId());
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("{id}/checkout")]
        public async Task<IActionResult> Checkout(int id, [FromBody] CheckoutRepairDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(Response<string>.Failure("Dữ liệu không hợp lệ"));

            var result = await _repairService.CheckoutAsync(id, dto, GetCurrentUserId());
            if (!result.Success) return BadRequest(result);

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRepair(int id)
        {
            var result = await _repairService.DeleteRepairAsync(id);
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("lookup")]
        public async Task<IActionResult> LookupByPhone([FromQuery] string phone)
        {
            var result = await _repairService.LookupByPhoneAsync(phone);
            if (!result.Success)
            {
                if (result.Message == "Vui lòng nhập số điện thoại") return BadRequest(result);
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost("{id}/parts")]
        public async Task<IActionResult> AddRepairPart(int id, [FromBody] AddRepairPartDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(Response<string>.Failure("Dữ liệu không hợp lệ"));

            var result = await _repairService.AddRepairPartAsync(id, dto, GetCurrentUserId());
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpDelete("{id}/parts/{partId}")]
        public async Task<IActionResult> RemoveRepairPart(int id, int partId)
        {
            var result = await _repairService.RemoveRepairPartAsync(id, partId, GetCurrentUserId());
            if (!result.Success) return NotFound(result);

            return Ok(result);
        }
    }
}
