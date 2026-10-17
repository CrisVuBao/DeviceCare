using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DeviceCare.Application.Common;
using DeviceCare.Application.DTOs.Auth;
using DeviceCare.Domain.Models;
using DeviceCare.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DeviceCare.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly DeviceCareDbContext _context;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            DeviceCareDbContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _environment = environment;
            _context = context;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }
            // Kiểm tra tính duy nhất của email và sđt
            var existingEmail = await _userManager.FindByEmailAsync(model.Email);
            if (existingEmail != null)
            {
                return BadRequest(Response<string>.Failure("Email đã được sử dụng"));
            }

            var existingPhone = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == model.PhoneNumber);
            if (existingPhone != null)
            {
                return BadRequest(Response<string>.Failure("Số điện thoại đã được sử dụng"));
            }

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                PhoneNumber = model.PhoneNumber,
                EmailConfirmed = true,
                PhoneNumberConfirmed = true,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(Response<string>.Failure(errors));
            }

            // Phân quyền cho tk mới
            string roleName = model.Role == "Admin" ? "Admin" : "Employee";
            await _userManager.AddToRoleAsync(user, roleName);

            // Tự động tạo hồ sơ nhân viên
            var employee = new Employee
            {
                UserId = user.Id,
                Position = model.Position ?? "Kỹ thuật viên",
                Salary = model.Salary,
                HireDate = DateTime.UtcNow,
                IsActive = true
            };
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return Ok(Response<string>.SuccessResult("Tạo tài khoản nhân viên thành công", user.Id.ToString()));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            // Tìm kiếm tk thông qua mail hoặc sđt
            var user = await _userManager.FindByEmailAsync(model.EmailOrPhone);
            if (user == null)
            {
                user = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == model.EmailOrPhone);
            }

            if (user == null)
            {
                return Unauthorized(Response<string>.Failure("Tài khoản không tồn tại"));
            }

            if (user.Status == "Blocked" || user.Status == "Inactive")
            {
                return Unauthorized(Response<string>.Failure("Tài khoản của bạn đã bị khóa"));
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!isPasswordValid)
            {
                return Unauthorized(Response<string>.Failure("Sai mật khẩu"));
            }

            var roles = await _userManager.GetRolesAsync(user);
            string userRole = roles.FirstOrDefault() ?? "Employee";

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == user.Id);

            // Tạo mã xác thực token với các thông tin định danh và quyền
            var token = GenerateJwtToken(user, userRole, employee?.EmployeeId);

            // Lưu mã token vào cookie
            var isDev = _environment.IsDevelopment();
            Response.Cookies.Append("Authorization", "Bearer " + token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev && Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTime.UtcNow.AddDays(7)
            });

            var userDto = new UserDto
            {
                Id = user.Id,
                EmployeeId = employee?.EmployeeId,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                Role = userRole,
                Position = employee?.Position
            };

            return Ok(Response<object>.SuccessResult("Đăng nhập thành công", new { Token = token, User = userDto }));
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var isDev = _environment.IsDevelopment();
            Response.Cookies.Delete("Authorization", new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev && Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            });

            return Ok(Response<string>.SuccessResult("Đăng xuất thành công", "Success"));
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null)
            {
                return NotFound(Response<string>.Failure("Người dùng không tồn tại"));
            }

            var roles = await _userManager.GetRolesAsync(user);
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == user.Id);

            var userDto = new UserDto
            {
                Id = user.Id,
                EmployeeId = employee?.EmployeeId,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                Role = roles.FirstOrDefault() ?? "Employee",
                Position = employee?.Position
            };

            return Ok(Response<UserDto>.SuccessResult("Lấy thông tin thành công", userDto));
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null)
            {
                return NotFound(Response<string>.Failure("Người dùng không tồn tại"));
            }

            var existingPhone = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == model.PhoneNumber && u.Id != user.Id);
            if (existingPhone != null)
            {
                return BadRequest(Response<string>.Failure("Số điện thoại đã được người khác sử dụng"));
            }

            user.FullName = model.FullName;
            user.PhoneNumber = model.PhoneNumber;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(Response<string>.Failure("Cập nhật thông tin thất bại"));
            }

            return Ok(Response<string>.SuccessResult("Cập nhật thông tin thành công", "Success"));
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Response<string>.Failure("Dữ liệu đầu vào không hợp lệ"));
            }

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null)
            {
                return NotFound(Response<string>.Failure("Người dùng không tồn tại"));
            }

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(Response<string>.Failure(errors));
            }

            return Ok(Response<string>.SuccessResult("Đổi mật khẩu thành công", "Success"));
        }

        private string GenerateJwtToken(ApplicationUser user, string role, int? employeeId)
        {
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Role, role)
            };

            if (employeeId.HasValue)
            {
                authClaims.Add(new Claim("employeeId", employeeId.Value.ToString()));
            }

            var jwtKey = _configuration["Jwt:Key"] ?? "DeviceCareApp_SecureJwtSigningKey_2026_@_AdvancedSecurity_512Bit_Key_9876543210_!#$";
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "DeviceCareApp",
                audience: _configuration["Jwt:Audience"] ?? "DeviceCareApp",
                expires: DateTime.UtcNow.AddDays(7),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<UserListDto>();
            
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new UserListDto
                {
                    Id = user.Id.ToString(),
                    FullName = user.FullName,
                    Email = user.Email ?? string.Empty,
                    PhoneNumber = user.PhoneNumber ?? string.Empty,
                    Role = roles.FirstOrDefault() ?? "Employee",
                    Status = user.Status
                });
            }

            return Ok(Response<List<UserListDto>>.SuccessResult("Lấy danh sách thành công", userList));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleDto model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(Response<string>.Failure("Không tìm thấy tài khoản"));
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            var result = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!result.Succeeded)
            {
                return BadRequest(Response<string>.Failure("Lỗi khi xóa quyền cũ"));
            }

            string roleName = model.Role == "Admin" ? "Admin" : "Employee";
            result = await _userManager.AddToRoleAsync(user, roleName);
            if (!result.Succeeded)
            {
                return BadRequest(Response<string>.Failure("Lỗi khi cập nhật quyền mới"));
            }

            return Ok(Response<string>.SuccessResult("Cập nhật quyền thành công", "Success"));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateUserStatusDto model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(Response<string>.Failure("Không tìm thấy tài khoản"));
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == id)
            {
                return BadRequest(Response<string>.Failure("Bạn không thể tự khóa tài khoản của chính mình"));
            }

            user.Status = model.Status;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(Response<string>.Failure("Lỗi khi cập nhật trạng thái"));
            }

            // Đồng bộ trạng thái hoạt động sang hồ sơ nhân viên
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == user.Id);
            if (employee != null)
            {
                employee.IsActive = (user.Status == "Active");
                await _context.SaveChangesAsync();
            }

            return Ok(Response<string>.SuccessResult("Cập nhật trạng thái thành công", user.Status));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(Response<string>.Failure("Không tìm thấy tài khoản"));
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == id)
            {
                return BadRequest(Response<string>.Failure("Bạn không thể tự xóa chính mình"));
            }

            // Xóa hồ sơ nhân viên liên quan nếu tồn tại
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == user.Id);
            if (employee != null)
            {
                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(Response<string>.Failure("Lỗi khi xóa tài khoản"));
            }

            return Ok(Response<string>.SuccessResult("Xóa tài khoản thành công", "Success"));
        }
    }
}
