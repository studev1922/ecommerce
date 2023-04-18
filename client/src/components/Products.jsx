import { useState } from "react";

const default_img = 'https://apollobattery.com.au/wp-content/uploads/2022/08/default-product-image.png';
const Product = (props) => {
    const { e, setState, qty } = props;
    return <>
        <div style={{ width: `${100 / (qty || 5)}%`, flex: '0 0 auto', padding: '.25rem' }}>
            <div className="card w-100 h-100">
                <img src={e.images[0] || default_img} className="card-img-top" alt={e.name} />
                <div className="card-body">
                    <h5 className="card-title">{e.subject}</h5>
                    <p className="card-text">{e.note}</p>
                </div>
                <div className="card-footer">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3>{e.prid}</h3>
                        <img src={e.user.image} alt={e.user.name}
                            width={'64px'} height={'64px'} className="rounded-circle border"
                            style={{objectFit: 'cover'}}
                        />
                    </div>
                    <small className="text-body-secondary">{e.price}</small>
                </div>
            </div>
        </div >
    </>
}

const script = {
    clientData: (parentID) => {
        if (!parentID) throw new Error(`parameter's parentID is empty!`);
        const parent = document.getElementById(parentID);
        if (!parent) return {};

        let [ps, pw] = [parent.scrollWidth, parent.clientWidth];
        let range = (ps - (ps % pw)) / pw;

        return { ps, pw, range, parent };
    },
    getPagination: (parentID) => {
        const { range } = script.clientData(parentID);
        if (!range) return;
        return [...Array(range + 1)];
    },
    translateX: (pagination, parentID, page) => {
        const [state, setState] = pagination;
        const { pw, range, parent } = script.clientData(parentID);

        if (typeof page == 'number') {
            state.page = page < 0 || range < page ? 0 : page;
        } else if (page) state.page = state.page < range ? ++state.page : 0;
        else state.page = state.page > 0 ? --state.page : range;

        parent.style.transform = `translateX(-${state.page * pw}px)`;
        setState(state);
    }
}

const Products = (props) => {
    const showPrdsID = 'ShowListProduct';
    const { products, setState } = props;
    const pagination = useState({ page: 0, qty: 5 });
    const pages = script.getPagination(showPrdsID);

    return <>
        <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', transition: "all 1s ease" }} id={showPrdsID}> {
                (Array.isArray(products) && products.map((e, i) =>
                    <Product key={i} e={e} setState={setState} qty={pagination[0].qty} />
                )) || <Product e={products} setState={setState} qty={pagination[0].qty} />
            }</div>
        </div>
        {pages?.length &&
            <nav className="overflow-auto d-flex justify-content-center" aria-label="Page navigation example">
                <ul className="pagination m-1">
                    <li className="page-item"
                        onClick={(_evt) => script.translateX(pagination, showPrdsID, false)}>
                        <a className="page-link">previous</a>
                    </li>
                    {pages.map((e, i) => <li key={i} className="page-item page-link"
                        onClick={(_evt) => script.translateX(pagination, showPrdsID, i)}>{i + 1}</li>
                    )}
                    <li className="page-item"
                        onClick={(_evt) => script.translateX(pagination, showPrdsID, true)}>
                        <a className="page-link">next</a>
                    </li>
                </ul>
            </nav>
        }
    </>
}
export { Product };
export default Products;