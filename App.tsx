import { Provider } from 'react-redux'
import { store } from './state/store'
import Ft8 from './Ft8'


export default function App() {
    
    return (
        <>
            <Provider store={ store }>
                <Ft8 />
            </Provider>
        </>
    )
}
    