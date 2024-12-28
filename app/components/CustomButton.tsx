import { Link } from 'react-router';
import {  ButtonProps, buttonVariants } from '~/components/ui/button'

interface CustomButtonProps extends ButtonProps {
  to: string
}

export const CustomButton = (props: CustomButtonProps) => (
  <div>
   
      <Link className={buttonVariants({ variant: "outline" })} to={props.to} >
        {props.children}
      </Link>

  </div>
)