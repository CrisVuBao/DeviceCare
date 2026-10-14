using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DeviceCare.Domain.Models
{
    public class Customer
    {
        [Key]
        public int CustomerId { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        public int LoyaltyPoints { get; set; } = 0;

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Repair> Repairs { get; set; } = new List<Repair>();
    }
}
