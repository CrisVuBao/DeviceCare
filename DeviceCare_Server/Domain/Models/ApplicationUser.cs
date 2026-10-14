using Microsoft.AspNetCore.Identity;
using System;
using System.ComponentModel.DataAnnotations;

namespace DeviceCare.Domain.Models
{
    public class ApplicationUser : IdentityUser<int>
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public override string? Email { get; set; }

        [Required]
        [Phone]
        [MaxLength(15)]
        public override string? PhoneNumber { get; set; }

        public string? Avatar { get; set; }

        [MaxLength(10)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Employee? Employee { get; set; }
    }
}
