using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;
using DeviceCare.Application.Contracts.Persistence;
using DeviceCare.Application.DTOs.Dashboard;
using DeviceCare.Application.Services;

namespace DeviceCare.UnitTests.Services
{
    public class DashboardServiceTests : IDisposable
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IDashboardRepository> _mockDashboardRepo;
        private readonly IMemoryCache _memoryCache;
        private readonly DashboardService _dashboardService;

        public DashboardServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockDashboardRepo = new Mock<IDashboardRepository>();
            _mockUnitOfWork.Setup(u => u.Dashboards).Returns(_mockDashboardRepo.Object);

            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _dashboardService = new DashboardService(_mockUnitOfWork.Object, _memoryCache);
        }

        public void Dispose()
        {
            _memoryCache.Dispose();
        }

        [Fact]
        public async Task GetSummaryAsync_WhenCacheIsEmpty_CallsRepositoryAndReturnsSuccess()
        {
            var expectedDto = CreateSampleDto(totalPending: 8, totalCompleted: 25, totalRevenue: 35000000m, newCustomers: 12);
            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync("week"))
                .ReturnsAsync(expectedDto);

            var result = await _dashboardService.GetSummaryAsync("week");

            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Message.Should().Be("Lấy dữ liệu thống kê thành công");
            result.Data.Should().NotBeNull();
            result.Data!.TotalPending.Should().Be(8);
            result.Data.TotalCompleted.Should().Be(25);
            result.Data.TotalRevenue.Should().Be(35000000m);
            result.Data.NewCustomers.Should().Be(12);

            _mockDashboardRepo.Verify(r => r.GetDashboardSummaryAsync("week"), Times.Once);
        }

        [Fact]
        public async Task GetSummaryAsync_WhenCalledTwice_ReturnsCachedDataWithoutSecondRepositoryCall()
        {
            var expectedDto = CreateSampleDto(totalPending: 5, totalCompleted: 15, totalRevenue: 20000000m, newCustomers: 7);
            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync("month"))
                .ReturnsAsync(expectedDto);

            var firstCall = await _dashboardService.GetSummaryAsync("month");
            var secondCall = await _dashboardService.GetSummaryAsync("month");

            firstCall.Success.Should().BeTrue();
            secondCall.Success.Should().BeTrue();
            firstCall.Data.Should().BeSameAs(expectedDto);
            secondCall.Data.Should().BeSameAs(expectedDto);

            _mockDashboardRepo.Verify(r => r.GetDashboardSummaryAsync("month"), Times.Once);
        }

        [Theory]
        [InlineData(null, "week")]
        [InlineData("", "week")]
        [InlineData("   ", "week")]
        [InlineData("WEEK", "week")]
        [InlineData(" Month ", "month")]
        [InlineData("YEAR", "year")]
        public async Task GetSummaryAsync_NormalizesPeriodParameterCorrectly(string? inputPeriod, string expectedNormalized)
        {
            var sampleDto = CreateSampleDto();
            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync(expectedNormalized))
                .ReturnsAsync(sampleDto);

            var result = await _dashboardService.GetSummaryAsync(inputPeriod!);

            result.Success.Should().BeTrue();
            _mockDashboardRepo.Verify(r => r.GetDashboardSummaryAsync(expectedNormalized), Times.Once);
        }

        [Fact]
        public async Task GetSummaryAsync_DifferentPeriods_StoredUnderSeparateCacheKeys()
        {
            var weekDto = CreateSampleDto(totalPending: 3);
            var monthDto = CreateSampleDto(totalPending: 15);

            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync("week")).ReturnsAsync(weekDto);
            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync("month")).ReturnsAsync(monthDto);

            var resultWeek1 = await _dashboardService.GetSummaryAsync("week");
            var resultMonth1 = await _dashboardService.GetSummaryAsync("month");
            var resultWeek2 = await _dashboardService.GetSummaryAsync("week");
            var resultMonth2 = await _dashboardService.GetSummaryAsync("month");

            resultWeek1.Data!.TotalPending.Should().Be(3);
            resultMonth1.Data!.TotalPending.Should().Be(15);
            resultWeek2.Data!.TotalPending.Should().Be(3);
            resultMonth2.Data!.TotalPending.Should().Be(15);

            _mockDashboardRepo.Verify(r => r.GetDashboardSummaryAsync("week"), Times.Once);
            _mockDashboardRepo.Verify(r => r.GetDashboardSummaryAsync("month"), Times.Once);
        }

        [Fact]
        public async Task InvalidateCache_ClearsCachedSummary_NextCallReFetchesFromRepository()
        {
            var expectedDto = CreateSampleDto();
            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync("week"))
                .ReturnsAsync(expectedDto);

            await _dashboardService.GetSummaryAsync("week");
            _dashboardService.InvalidateCache();
            await _dashboardService.GetSummaryAsync("week");

            _mockDashboardRepo.Verify(r => r.GetDashboardSummaryAsync("week"), Times.Exactly(2));
        }

        [Fact]
        public async Task GetSummaryAsync_ReturnsDetailedListsCorrectly()
        {
            var detailedDto = new DashboardSummaryDto
            {
                TotalPending = 2,
                TotalCompleted = 10,
                TotalRevenue = 15000000m,
                NewCustomers = 4,
                ChartData = new List<ChartDataDto>
                {
                    new ChartDataDto { Name = "T2", DoanhThu = 5000000m, Phieu = 3 },
                    new ChartDataDto { Name = "T3", DoanhThu = 10000000m, Phieu = 7 }
                },
                RecentRepairs = new List<RecentRepairDto>
                {
                    new RecentRepairDto { Id = 1, Code = "SR-001", Device = "iPhone 13", Status = "Tiếp nhận", Time = "10:00", Customer = "Nguyễn Văn A", TotalAmount = 500000m }
                },
                StatusDistribution = new List<StatusDistributionDto>
                {
                    new StatusDistributionDto { Status = "TiepNhan", Label = "Tiếp nhận", Count = 2 },
                    new StatusDistributionDto { Status = "HoanThanh", Label = "Hoàn thành", Count = 10 }
                }
            };

            _mockDashboardRepo.Setup(r => r.GetDashboardSummaryAsync("week"))
                .ReturnsAsync(detailedDto);

            var result = await _dashboardService.GetSummaryAsync("week");

            result.Data.Should().NotBeNull();
            result.Data!.ChartData.Should().HaveCount(2);
            result.Data.RecentRepairs.Should().HaveCount(1);
            result.Data.RecentRepairs[0].Code.Should().Be("SR-001");
            result.Data.StatusDistribution.Should().HaveCount(2);
        }

        private static DashboardSummaryDto CreateSampleDto(
            int totalPending = 0,
            int totalCompleted = 0,
            decimal totalRevenue = 0,
            int newCustomers = 0)
        {
            return new DashboardSummaryDto
            {
                TotalPending = totalPending,
                TotalCompleted = totalCompleted,
                TotalRevenue = totalRevenue,
                NewCustomers = newCustomers,
                ChartData = new List<ChartDataDto>(),
                RecentRepairs = new List<RecentRepairDto>(),
                StatusDistribution = new List<StatusDistributionDto>()
            };
        }
    }
}
