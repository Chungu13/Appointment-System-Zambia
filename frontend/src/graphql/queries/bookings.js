import { gql } from '@apollo/client'

export const MY_APPOINTMENTS = gql`
  query MyAppointments($dateFrom: Date, $dateTo: Date, $status: String) {
    myAppointments(dateFrom: $dateFrom, dateTo: $dateTo, status: $status) {
      id
      status
      startsAt
      endsAt
      bookedBy
      customerNotes
      customer {
        id
        fullName
        phone
        visitCount
        noShowCount
      }
      staff {
        id
        fullName
        avatarUrl
      }
      service {
        id
        name
        category
        durationMinutes
        priceZmw
        depositZmw
      }
      payments {
        id
        amountZmw
        paymentType
        method
        status
        paidAt
      }
    }
  }
`

export const DASHBOARD_STATS = gql`
  query DashboardStats($date: Date) {
    dashboardStats(date: $date) {
      todayRevenue
      todayBookings
      bookedByAgent
      slotsRecovered
    }
  }
`

export const AGENT_ACTIVITY = gql`
  query AgentActivity($limit: Int, $agentType: String) {
    agentActivity(limit: $limit, agentType: $agentType) {
      id
      agentType
      action
      outcome
      createdAt
    }
  }
`

export const MY_STAFF_APPOINTMENTS = gql`
  query MyStaffAppointments($dateFrom: Date, $dateTo: Date) {
    myStaffAppointments(dateFrom: $dateFrom, dateTo: $dateTo) {
      id
      status
      startsAt
      endsAt
      customer { id fullName phone }
      service { id name durationMinutes priceZmw }
    }
  }
`

export const CUSTOMER_APPOINTMENTS = gql`
  query CustomerAppointments($phone: String!) {
    customerAppointments(phone: $phone) {
      id
      status
      startsAt
      endsAt
      service { id name priceZmw }
      staff { id fullName }
    }
  }
`
