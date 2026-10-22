using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.Contracts.Services;
using DeviceCare.Infrastructure.Data;
using DeviceCare.Infrastructure.Repositories;
using DeviceCare.Infrastructure.Services;

namespace DeviceCare.Infrastructure
{
    // Cấu hình tiêm phụ thuộc cho tầng Infrastructure
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Db context
            services.AddDbContext<DeviceCareDbContext>(options =>
            {
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            });

            // đk service thời gian
            services.AddSingleton<IDateTimeProvider, VietnamDateTimeProvider>();

            // Đk repository và UnitOfWork
            services.AddScoped<ICustomerRepository, CustomerRepository>();
            services.AddScoped<IInventoryRepository, InventoryRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }
    }
}
