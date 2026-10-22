using Microsoft.Extensions.DependencyInjection;
using DeviceCare.Application.Services;

namespace DeviceCare.Application
{
    // Cấu hình tiêm phụ thuộc cho tầng application
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<ICustomerService, CustomerService>();
            services.AddScoped<IInventoryService, InventoryService>();

            return services;
        }
    }
}
