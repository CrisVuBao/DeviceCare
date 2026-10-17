using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using DeviceCare.Domain.Models;

namespace DeviceCare.Infrastructure.Data
{
    public class DbInitializer
    {
        public static async Task InitializeAsync(UserManager<ApplicationUser> userManager, DeviceCareDbContext context)
        {
            // Tạo tk admin mặc định
            var adminUser = await userManager.FindByEmailAsync("admin@gmail.com");
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = "admin@gmail.com",
                    Email = "admin@gmail.com",
                    FullName = "Quản trị viên",
                    PhoneNumber = "0357988868",
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(adminUser, "Admin@1234");
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
            else
            {
                // Cập nhật mk mặc định nếu tk admin đã tồn tại
                var resetToken = await userManager.GeneratePasswordResetTokenAsync(adminUser);
                await userManager.ResetPasswordAsync(adminUser, resetToken, "Admin@1234");
            }

            // Tự động tạo hồ sơ nhân viên với tk admin
            if (adminUser != null)
            {
                var adminEmp = await context.Employees.FirstOrDefaultAsync(e => e.UserId == adminUser.Id);
                if (adminEmp == null)
                {
                    context.Employees.Add(new Employee
                    {
                        UserId = adminUser.Id,
                        Position = "Quản lý cửa hàng",
                        Salary = 0,
                        HireDate = DateTime.UtcNow,
                        IsActive = true
                    });
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
