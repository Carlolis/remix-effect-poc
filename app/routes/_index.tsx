import { CustomButton } from '~/components/CustomButton';






export default function Index() {
  return (
    <div
      style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4', marginTop: '20px' }}
      className="flex flex-col items-center justify-center"
    >
      <div className="space-y-4 text-center">
        <div>Welcome to POC</div>
        <div className="flex flex-col items-center space-y-2">
          <CustomButton to="/dashboard">
            Dashboard
          </CustomButton> 
          <CustomButton to="/signup">
            SIGN-UP
          </CustomButton>
          <CustomButton to="/login">
            LOGIN
          </CustomButton>
          <CustomButton to="/projects">
            YOUR PROJECTS
          </CustomButton>
          <CustomButton to="/createTicket">
            CREATE A TICKET
          </CustomButton>
          <CustomButton to="/tickets">
            YOUR TICKETS
          </CustomButton>
        </div>
      </div>
    </div>
  )
}
