using System.ComponentModel.DataAnnotations;

namespace DeviceCare.Application.DTOs.Auth
{
    public class RegisterDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        public string Role { get; set; } = "Employee";
        public string? Position { get; set; } = "Kỹ thuật viên";
        public decimal Salary { get; set; } = 0;
    }

    public class LoginDto
    {
        [Required]
        public string EmailOrPhone { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class UserDto
    {
        public int Id { get; set; }
        public int? EmployeeId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Position { get; set; }
    }

    public class UpdateProfileDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdateUserStatusDto
    {
        [Required]
        public string Status { get; set; } = "Active";
    }

    public class UpdateUserDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        public string? Position { get; set; }
        public decimal Salary { get; set; }
        public string? Role { get; set; }
    }

    public class ResetPasswordDto
    {
        [Required]
        public string NewPassword { get; set; } = string.Empty;
    }
}
