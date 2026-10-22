using System;
using System.ComponentModel.DataAnnotations;

namespace DeviceCare.Application.DTOs.Customer
{
    public class CustomerDto
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Note { get; set; }
        public int LoyaltyPoints { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalRepairs { get; set; }
    }

    public class CreateCustomerDto
    {
        [Required(ErrorMessage = "Họ tên không được để trống")]
        [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0")]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
        public string? Address { get; set; }

        [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Note { get; set; }
    }

    public class UpdateCustomerDto
    {
        [Required(ErrorMessage = "Họ tên không được để trống")]
        [MaxLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0")]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Địa chỉ không được vượt quá 200 ký tự")]
        public string? Address { get; set; }

        [MaxLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Note { get; set; }
    }
}
