import { ButtonGoBackHome } from '../components/buttonGoBackHome'

// names we are going to use in the strategy
export default function NotAuthorize() {
  return (
    <div className="font-sans leading-5 mt-10 flex flex-col items-center justify-center">
      <ButtonGoBackHome />
      <h1 className="text-2xl font-bold mt-10">- Please go back home -</h1>
    </div>
  )
}
