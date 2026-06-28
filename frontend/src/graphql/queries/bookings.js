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
      addonServices {
        id
        name
        durationMinutes
      }
    }
  }
`

export const DASHBOARD_STATS = gql`
  query DashboardStats($date: Date) {
    dashboardStats(date: $date) {
      earnedToday
      depositsToday
      todayBookings
      bookedByAgent
      cancelledToday
      pendingCompletion
    }
  }
`

export const AGENT_ACTIVITY = gql`
  query AgentActivity($limit: Int, $agentType: String, $date: Date) {
    agentActivity(limit: $limit, agentType: $agentType, date: $date) {
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

export const CUSTOMERS = gql`
  query Customers($search: String) {
    customers(search: $search) {
      id
      fullName
      phone
      visitCount
      noShowCount
      lastVisitAt
      createdAt
    }
  }
`

export const CHECK_PAYMENT_STATUS = gql`
  query CheckPaymentStatus($ref: String!) {
    checkPaymentStatus(ref: $ref) {
      status
      appointmentId
      serviceName
      startsAt
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

export const CUSTOMER_DETAIL = gql`
  query CustomerDetail($id: Int!) {
    customer(id: $id) {
      id
      fullName
      phone
      notes
      visitCount
      noShowCount
      lastVisitAt
      createdAt
    }
  }
`

export const CUSTOMER_APPOINTMENTS_BY_ID = gql`
  query CustomerAppointmentsById($customerId: Int!) {
    customerAppointmentsById(customerId: $customerId) {
      id
      status
      startsAt
      endsAt
      bookedBy
      service { id name priceZmw }
      staff { id fullName }
      payments { id amountZmw status paymentType }
      addonServices { id name priceZmw }
    }
  }
`
