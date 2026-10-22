using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Inventory;
using DeviceCare.Application.Services;

namespace DeviceCare.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // Lấy mã định danh người dùng đang đăng nhập
        private int? GetCurrentUserId()
        {
            var strId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(strId, out int id))
            {
                return id;
            }
            return null;
        }

        // Lấy danh sách linh kiện trong kho
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? brand)
        {
            bool isAdmin = User.IsInRole("Admin");
            var result = await _inventoryService.GetAllInventoriesAsync(isAdmin, category, brand);
            return Ok(result);
        }

        // Xem chi tiết một linh kiện kèm lịch sử biến động
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            bool isAdmin = User.IsInRole("Admin");
            var result = await _inventoryService.GetInventoryByIdAsync(id, isAdmin);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        // Lấy lịch sử biến động xuất nhập tồn của linh kiện
        [HttpGet("{id}/transactions")]
        public async Task<IActionResult> GetTransactions(int id)
        {
            var result = await _inventoryService.GetTransactionsAsync(id);
            return Ok(result);
        }

        // Thêm mới linh kiện vào kho (Chỉ quản trị viên)
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] InventoryCreateUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            var result = await _inventoryService.CreateInventoryAsync(dto, GetCurrentUserId());
            return Ok(result);
        }

        // Cập nhật thông tin linh kiện hoặc điều chỉnh tồn kho
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] InventoryCreateUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            var result = await _inventoryService.UpdateInventoryAsync(id, dto, GetCurrentUserId());
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        // Nhập thêm hàng vào kho (Chỉ quản trị viên)
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/import")]
        public async Task<IActionResult> ImportStock(int id, [FromBody] ImportInventoryDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            var result = await _inventoryService.ImportStockAsync(id, dto, GetCurrentUserId());
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        // Chuyển linh kiện sang trạng thái ngừng kinh doanh (Chỉ quản trị viên)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _inventoryService.DeleteInventoryAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }
    }
}
