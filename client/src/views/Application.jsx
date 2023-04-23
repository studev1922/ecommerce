import React from "react";
import axios from 'axios';

import Navbar from '../components/Navbar';
import Carousel from '../components/Carousel';
import Products from '../components/Products';

const LOCAL = `http://localhost:8080`;
const { path, page, qty } = { path: '/api/products', qty: 20, page: 0 };

class Application extends React.Component {

    state = {
        products: undefined
    }

    async componentDidMount() {
        const pathApi = `${LOCAL}${path}-page?qty=${qty}&page=${page}`;
        let result = await axios.get(pathApi);
        if (result.status === 200) {
            this.setState({ products: result.data });
            const size = (result.headers["content-length"] / (1024 * 1024)).toFixed(2);
            console.log(`get ${result?.data?.length} data from ${path} <---> size:(${size}MB)`);
        }

        ((count, speed) => {
            const pathApi = `${LOCAL}${path}-relationships`;
            const interval = setInterval(async () => {
                let result = await axios.get(pathApi, {timeout: 10E3});
                if(--count < 1) {
                    clearInterval(interval);
                    console.log('clear interval');
                } else if (result.status === 200) {
                    const size = (result.headers["content-length"] / (1024 * 1024)).toFixed(2);
                    console.log(`get ${result?.data?.length} data from ${path} <---> size:(${size}MB)`);
                }
            }, speed)
        
            const intervalCount = setInterval(() => {
                if(count < 0) clearInterval(intervalCount);
                else console.log(count);
            }, 5E3);
        
        })(10E3,1); // call 10 thousand times.
    }

    render() {
        const { products } = this.state;
        return products?.length
            ? <>
                <div className='container-xxl border-start border-end border-warning'>
                    <Navbar />
                    <header>
                        <Carousel />
                    </header>
                    <Products products={products} setState={this.setState} />
                </div>
            </>
            : <h1 className="text-center">Client waiting for data...</h1>
    }
}

export default Application;