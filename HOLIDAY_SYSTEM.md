# Holiday Management System

## Overview
The Holiday Management System allows admin users to set holidays for specific centers. During these holidays, interest calculations for loans associated with the center will be paused.

## Features

### 1. Holiday Management
- **Create Holidays**: Admin users can create holidays for specific centers
- **View Holidays**: View all holidays or filter by center/branch
- **Update Holidays**: Modify existing holiday details
- **Delete Holidays**: Soft delete holidays (mark as inactive)

### 2. Interest Calculation
- **Holiday-Aware Calculations**: Interest calculations automatically exclude holiday days
- **Center-Specific**: Each center can have its own set of holidays
- **Date Range Support**: Calculate interest for any date range

## API Endpoints

### Holiday Management

#### Create Holiday (Admin Only)
```
POST /holidays
Headers: {
  "user-id": "admin-user-id",
  "Content-Type": "application/json"
}
Body: {
  "name": "Independence Day",
  "date": "2024-02-04",
  "description": "Sri Lanka Independence Day",
  "centerId": "center-id",
  "branchId": "branch-id",
  "createdBy": "admin-user-id"
}
```

#### Get All Holidays
```
GET /holidays?year=2024&centerId=center-id&branchId=branch-id
```

#### Get Holidays by Center
```
GET /holidays/center/:centerId?year=2024
```

#### Get Holidays by Branch
```
GET /holidays/branch/:branchId?year=2024
```

#### Check if Date is Holiday
```
GET /holidays/check/:centerId/:date
```

#### Update Holiday (Admin Only)
```
PUT /holidays/:id
Headers: {
  "user-id": "admin-user-id",
  "Content-Type": "application/json"
}
Body: {
  "name": "Updated Holiday Name",
  "date": "2024-02-04",
  "description": "Updated description",
  "centerId": "center-id",
  "branchId": "branch-id"
}
```

#### Delete Holiday (Admin Only)
```
DELETE /holidays/:id
Headers: {
  "user-id": "admin-user-id"
}
```

### Interest Calculation

#### Calculate Interest for Single Loan
```
POST /interest/calculate
Body: {
  "loanId": "loan-id",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

#### Calculate Interest for Multiple Loans
```
POST /interest/calculate-multiple
Body: {
  "loanIds": ["loan-id-1", "loan-id-2"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

#### Calculate Interest for Center
```
GET /interest/calculate-center/:centerId?startDate=2024-01-01&endDate=2024-01-31
```

#### Check Holiday for Center
```
GET /interest/check-holiday/:centerId/:date
```

#### Get Holidays in Range
```
GET /interest/holidays/:centerId?startDate=2024-01-01&endDate=2024-01-31
```

## Database Schema

### Holiday Model
```javascript
{
  name: String (required),
  date: Date (required),
  description: String,
  centerId: ObjectId (ref: Center, required),
  branchId: ObjectId (ref: Branch, required),
  createdBy: ObjectId (ref: User, required),
  isActive: Boolean (default: true),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

### User Model (Updated)
```javascript
{
  name: String (required),
  email: String (required, unique),
  NIC_no: String (unique),
  phone_no: String,
  role: String (enum: ['admin', 'user', 'manager'], default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

## Frontend Integration

### HolidayScreen Features
- **Center Selection**: Dropdown to select specific centers
- **Calendar View**: Visual calendar with holiday markers
- **Admin Controls**: Add/delete holidays (admin only)
- **Holiday Details**: Modal showing holiday information
- **Real-time Updates**: Automatic refresh after changes

### Key Components
1. **Center Selector**: Filter holidays by center
2. **Calendar**: Display holidays with custom markers
3. **Add Holiday Modal**: Form for creating new holidays
4. **Holiday Details Modal**: View and manage existing holidays

## Usage Examples

### 1. Setting up a Holiday
```javascript
// Admin creates a holiday for a center
const holidayData = {
  name: "Poya Day",
  date: "2024-01-15",
  description: "Full Moon Poya Day",
  centerId: "center-123",
  branchId: "branch-456",
  createdBy: "admin-user-789"
};

const response = await fetch('/holidays', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'user-id': 'admin-user-789'
  },
  body: JSON.stringify(holidayData)
});
```

### 2. Calculating Interest with Holidays
```javascript
// Calculate interest excluding holiday days
const interestData = {
  loanId: "loan-123",
  startDate: "2024-01-01",
  endDate: "2024-01-31"
};

const response = await fetch('/interest/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(interestData)
});

const result = await response.json();
// Result includes: totalDays, workingDays, holidayDays, interestAmount
```

### 3. Checking if Date is Holiday
```javascript
// Check if a specific date is a holiday for a center
const response = await fetch('/interest/check-holiday/center-123/2024-01-15');
const result = await response.json();
// Result: { centerId: "center-123", date: "2024-01-15", isHoliday: true }
```

## Security

### Admin Authentication
- All holiday creation, update, and deletion operations require admin privileges
- Admin authentication middleware checks user role
- User ID must be provided in request headers

### Data Validation
- Date format validation
- Center and branch existence validation
- Duplicate holiday prevention for same center and date

## Error Handling

### Common Error Responses
```javascript
// 400 Bad Request
{
  "message": "loanId, startDate, and endDate are required"
}

// 401 Unauthorized
{
  "message": "User ID required"
}

// 403 Forbidden
{
  "message": "Admin access required"
}

// 404 Not Found
{
  "message": "Center not found"
}

// 500 Internal Server Error
{
  "message": "Something went wrong!"
}
```

## Future Enhancements

1. **Bulk Holiday Import**: Import holidays from CSV/Excel files
2. **Recurring Holidays**: Support for annual recurring holidays
3. **Holiday Templates**: Pre-defined holiday templates for common occasions
4. **Notification System**: Notify users about upcoming holidays
5. **Audit Trail**: Track all holiday changes with user timestamps
6. **Multi-center Holidays**: Set holidays for multiple centers at once
7. **Holiday Categories**: Categorize holidays (public, religious, etc.)
8. **Export Functionality**: Export holiday calendars to PDF/Excel 