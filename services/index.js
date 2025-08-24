// Service layer exports
const UserService = require('./userService');
const CustomerService = require('./customerService');
const LoanService = require('./loanService');
const ProductService = require('./productService');
const BranchService = require('./branchService');
const CenterService = require('./centerService');
const ReportsService = require('./reportsService');
const HolidayService = require('./holidayService');
const InterestCalculationService = require('./interestCalculationService');

module.exports = {
    UserService,
    CustomerService,
    LoanService,
    ProductService,
    BranchService,
    CenterService,
    ReportsService,
    HolidayService,
    InterestCalculationService
};
