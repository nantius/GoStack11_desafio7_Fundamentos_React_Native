import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@gomarketplace:products',
      );
      storageProducts !== null && setProducts(JSON.parse(storageProducts));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const product_found = products.find(
        product_finder => product_finder.id === product.id,
      );

      if (product_found === undefined) {
        setProducts(oldProducts => [
          ...oldProducts,
          { ...product, quantity: 1 },
        ]);
      } else {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          ),
        );
      }
      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(prods => {
        return prods.map(prod => ({
          ...prod,
          quantity: prod.id === id ? prod.quantity + 1 : prod.quantity,
        }));
      });
      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // Caso a quantidade seja 1, retirar o produto do carrinho
      const prod = products.find(product => product.id === id);
      if (prod && prod?.quantity === 1) {
        setProducts(prods => [...prods.filter(pro => pro.id !== id)]);
      } else {
        setProducts(prods => {
          return prods.map(pro => {
            if (pro.id === id) {
              return {
                ...pro,
                quantity: pro.quantity - 1,
              };
            }

            return { ...pro };
          });
        });
      }
      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}

export { CartProvider, useCart };
