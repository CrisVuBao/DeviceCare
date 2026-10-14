using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeviceCare.Domain.Models
{
    public class Employee
    {
        [Key]
        public int EmployeeId { get; set; }

        [ForeignKey("User")]
        public int UserId { get; set; }
        public ApplicationUser? User { get; set; }

        [MaxLength(50)]
        public string? Position { get; set; }

        public decimal Salary { get; set; } = 0;

        public DateTime HireDate { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public ICollection<Repair> Repairs { get; set; } = new List<Repair>();
    }
}
