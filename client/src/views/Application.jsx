import React from "react";
import axios from 'axios';

import Navbar from '../components/Navbar';
import Carousel from '../components/Carousel';
import Products from '../components/Products';

const LOCAL = `http://localhost:8080`;
const { path, page, qty } = { path: '/api/products', qty: 100, page: 0 };

class Application extends React.Component {

    state = {
        products: undefined
    }

    async componentDidMount() {
        const pathApi = `${LOCAL}${path}-page?qty=${qty}&page=${page}`;
        let result = await axios.get(pathApi);
        if (result.status == 200) {
            this.state.products = result.data.splice(0, 20);
            this.setState(this.state);
            const size = (result.headers["content-length"] / (1024 * 1024)).toFixed(2);
            console.log(`get ${result?.data?.length} data from ${path} <---> size:(${size}MB)`);
        }
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