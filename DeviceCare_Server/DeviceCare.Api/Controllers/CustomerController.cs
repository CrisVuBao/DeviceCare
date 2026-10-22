using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Customer;
using DeviceCare.Application.Services;

namespace DeviceCare.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Employee")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _customerService.GetAllCustomersAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _customerService.GetCustomerByIdAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpGet("find/{phone}")]
        public async Task<IActionResult> FindByPhone(string phone)
        {
            var result = await _customerService.FindByPhoneAsync(phone);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        // Xem lịch sử các lần sửa chữa của khách hàng
        [HttpGet("{id}/repairs")]
        public async Task<IActionResult> GetCustomerRepairs(int id)
        {
            var result = await _customerService.GetCustomerRepairsAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCustomerDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            var result = await _customerService.CreateCustomerAsync(model);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.CustomerId }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            var result = await _customerService.UpdateCustomerAsync(id, model);
            if (!result.Success)
            {
                if (result.Message == "Không tìm thấy khách hàng")
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        // Xóa mềm khách hàng,chỉ quản trị viên
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _customerService.DeleteCustomerAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }
    }
}
