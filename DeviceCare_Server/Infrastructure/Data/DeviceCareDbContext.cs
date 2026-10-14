using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using DeviceCare.Domain.Models;

namespace DeviceCare.Infrastructure.Data
{
    public class DeviceCareDbContext : IdentityDbContext<ApplicationUser, Role, int>
    {
        public DeviceCareDbContext(DbContextOptions<DeviceCareDbContext> options) : base(options)
        {
        }

        #region DbSets
        public DbSet<Customer> Customers { get; set; } = null!;
        public DbSet<Employee> Employees { get; set; } = null!;
        public DbSet<Repair> Repairs { get; set; } = null!;
        public DbSet<RepairStatusHistory> RepairStatusHistories { get; set; } = null!;
        public DbSet<Inventory> Inventories { get; set; } = null!;
        public DbSet<RepairPart> RepairParts { get; set; } = null!;
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<Warranty> Warranties { get; set; } = null!;
        #endregion

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<decimal>().HavePrecision(18, 2);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ApplicationUser>(b =>
            {
                b.ToTable("Users");
                b.HasIndex(u => u.Email).IsUnique();
                b.HasIndex(u => u.PhoneNumber).IsUnique();
            });

            modelBuilder.Entity<Role>(b =>
            {
                b.ToTable("Roles");
            });

            modelBuilder.Entity<IdentityUserRole<int>>(b => b.ToTable("UserRoles"));
            modelBuilder.Entity<IdentityUserClaim<int>>(b => b.ToTable("UserClaims"));
            modelBuilder.Entity<IdentityUserLogin<int>>(b => b.ToTable("UserLogins"));
            modelBuilder.Entity<IdentityRoleClaim<int>>(b => b.ToTable("RoleClaims"));
            modelBuilder.Entity<IdentityUserToken<int>>(b => b.ToTable("UserTokens"));

            // Employee và User 1-1
            modelBuilder.Entity<Employee>(b =>
            {
                b.ToTable("Employees");
                b.HasIndex(e => e.UserId).IsUnique();
                b.HasOne(e => e.User)
                 .WithOne(u => u.Employee)
                 .HasForeignKey<Employee>(e => e.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Customer>(b =>
            {
                b.ToTable("Customers");
                b.HasIndex(c => c.PhoneNumber).IsUnique();
                b.HasIndex(c => c.FullName);
            });


            modelBuilder.Entity<Repair>(b =>
            {
                b.ToTable("Repairs");
                b.HasIndex(r => r.RepairCode).IsUnique();
                b.HasIndex(r => r.Status);
                b.HasIndex(r => r.CreatedAt);
                b.HasIndex(r => r.CustomerId);

                b.HasOne(r => r.Customer)
                 .WithMany(c => c.Repairs)
                 .HasForeignKey(r => r.CustomerId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(r => r.Employee)
                 .WithMany(e => e.Repairs)
                 .HasForeignKey(r => r.EmployeeId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<RepairStatusHistory>(b =>
            {
                b.ToTable("RepairStatusHistories");
                b.HasIndex(h => h.RepairId);

                b.HasOne(h => h.Repair)
                 .WithMany(r => r.StatusHistories)
                 .HasForeignKey(h => h.RepairId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(h => h.ChangedByUser)
                 .WithMany()
                 .HasForeignKey(h => h.ChangedByUserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Inventory>(b =>
            {
                b.ToTable("Inventories");
                b.HasIndex(i => i.Name);
            });

            modelBuilder.Entity<RepairPart>(b =>
            {
                b.ToTable("RepairParts");
                b.HasIndex(rp => rp.RepairId);
                b.HasIndex(rp => rp.InventoryId);

                b.HasOne(rp => rp.Repair)
                 .WithMany(r => r.RepairParts)
                 .HasForeignKey(rp => rp.RepairId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(rp => rp.Inventory)
                 .WithMany(i => i.RepairParts)
                 .HasForeignKey(rp => rp.InventoryId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<InventoryTransaction>(b =>
            {
                b.ToTable("InventoryTransactions");
                b.HasIndex(t => t.InventoryId);
                b.HasIndex(t => t.RepairId);

                b.HasOne(t => t.Inventory)
                 .WithMany(i => i.InventoryTransactions)
                 .HasForeignKey(t => t.InventoryId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(t => t.Repair)
                 .WithMany(r => r.InventoryTransactions)
                 .HasForeignKey(t => t.RepairId)
                 .OnDelete(DeleteBehavior.SetNull);

                b.HasOne(t => t.User)
                 .WithMany()
                 .HasForeignKey(t => t.UserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // Invoice 1-1 với Repair
            modelBuilder.Entity<Invoice>(b =>
            {
                b.ToTable("Invoices");
                b.HasIndex(i => i.InvoiceCode).IsUnique();
                b.HasIndex(i => i.RepairId).IsUnique();

                b.HasOne(i => i.Repair)
                 .WithOne(r => r.Invoice)
                 .HasForeignKey<Invoice>(i => i.RepairId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Warranty 1-1 với Repair
            modelBuilder.Entity<Warranty>(b =>
            {
                b.ToTable("Warranties");
                b.HasIndex(w => w.RepairId).IsUnique();

                b.HasOne(w => w.Repair)
                 .WithOne(r => r.Warranty)
                 .HasForeignKey<Warranty>(w => w.RepairId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Thiết lập Role
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Admin", NormalizedName = "ADMIN" },
                new Role { Id = 2, Name = "Employee", NormalizedName = "EMPLOYEE" }
            );
        }
    }
}
