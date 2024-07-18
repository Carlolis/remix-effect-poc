import { CustomButton } from './CustomButton'
import { ButtonProps } from './ui/button'

export const ButtonGoBackHome = (props: ButtonProps) => (
  <div>
     <CustomButton to="/">Go back home
   
    {props.children}</CustomButton>
  </div>
)
