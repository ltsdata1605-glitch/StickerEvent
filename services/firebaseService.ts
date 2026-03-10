import { db, auth } from '../firebase';
import { collection, doc, writeBatch, getDocs, query, where, Timestamp, getDocFromServer, deleteDoc, setDoc } from 'firebase/firestore';
import { Product, InventoryItem } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const BATCH_SIZE = 500;

export const uploadProductsToFirestore = async (storeId: string, products: Product[]) => {
  if (!storeId) throw new Error("Mã kho không hợp lệ.");
  
  const productsRef = collection(db, 'stores', storeId, 'products');
  
  try {
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = products.slice(i, i + BATCH_SIZE);
      
      chunk.forEach(product => {
        const safeMsp = product.msp.replace(/\//g, '_');
        const docRef = doc(productsRef, safeMsp);
        batch.set(docRef, {
          ...product,
          storeId,
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `stores/${storeId}/products`);
  }
};

export const uploadInventoryToFirestore = async (storeId: string, inventory: InventoryItem[]) => {
  if (!storeId) throw new Error("Mã kho không hợp lệ.");
  
  const inventoryRef = collection(db, 'stores', storeId, 'inventory');
  
  try {
    for (let i = 0; i < inventory.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = inventory.slice(i, i + BATCH_SIZE);
      
      chunk.forEach(item => {
        const safeId = item.maSanPham.replace(/\//g, '_');
        const docRef = doc(inventoryRef, safeId);
        batch.set(docRef, {
          ...item,
          storeId,
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `stores/${storeId}/inventory`);
  }
};

export const fetchProductsFromFirestore = async (storeId: string): Promise<Product[]> => {
  if (!storeId) return [];
  
  const productsRef = collection(db, 'stores', storeId, 'products');
  try {
    const q = query(productsRef);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
          msp: data.msp,
          sanPham: data.sanPham,
          thuongERP: data.thuongERP,
          thuongNong: data.thuongNong,
          tongThuong: data.tongThuong,
          giaGoc: data.giaGoc,
          giaGiam: data.giaGiam,
          khuyenMai: data.khuyenMai,
          ngayIn: data.ngayIn,
          selected: false,
          quantity: 1,
      } as Product;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `stores/${storeId}/products`);
    return [];
  }
};

export const fetchInventoryFromFirestore = async (storeId: string): Promise<InventoryItem[]> => {
  if (!storeId) return [];
  
  const inventoryRef = collection(db, 'stores', storeId, 'inventory');
  try {
    const q = query(inventoryRef);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
          maSieuThi: data.maSieuThi,
          tenSieuThi: data.tenSieuThi,
          thuongHieu: data.thuongHieu,
          nganhHang: data.nganhHang,
          nhomHang: data.nhomHang,
          maSanPham: data.maSanPham,
          tenSanPham: data.tenSanPham,
          trangThaiKinhDoanh: data.trangThaiKinhDoanh,
          trangThaiSanPham: data.trangThaiSanPham,
          tongSoLuong: data.tongSoLuong,
          soLuongDiDuong: data.soLuongDiDuong,
          soLuongThucTe: data.soLuongThucTe,
          soLuongDaDat: data.soLuongDaDat,
          soLuongCoTheBan: data.soLuongCoTheBan,
          sucBan: data.sucBan,
          saleAverage: data.saleAverage,
          saleEstimate: data.saleEstimate,
      } as InventoryItem;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `stores/${storeId}/inventory`);
    return [];
  }
};

export const clearStoreDataOnFirestore = async (storeId: string, collectionName: 'products' | 'inventory') => {
    if (!storeId) return;
    const ref = collection(db, 'stores', storeId, collectionName);
    try {
        const snapshot = await getDocs(ref);
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + BATCH_SIZE);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `stores/${storeId}/${collectionName}`);
    }
}

export const fetchAllUsers = async (storeId: string) => {
    if (!storeId) return [];
    const usersRef = collection(db, 'users');
    try {
        const q = query(usersRef, where('storeId', '==', storeId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        return [];
    }
};

export const updateUserRole = async (userId: string, role: 'admin' | 'staff') => {
    if (!userId) throw new Error("User ID is required");
    const userRef = doc(db, 'users', userId);
    try {
        const batch = writeBatch(db);
        batch.update(userRef, { role });
        await batch.commit();
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
};

export const deleteUserDoc = async (userId: string) => {
    if (!userId) throw new Error("User ID is required");
    const userRef = doc(db, 'users', userId);
    try {
        await deleteDoc(userRef);
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
};

export const clearAllUsers = async (storeId: string) => {
    if (!storeId) return;
    const usersRef = collection(db, 'users');
    try {
        const q = query(usersRef, where('storeId', '==', storeId));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;
        
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + BATCH_SIZE);
            chunk.forEach(doc => {
                if (doc.data().username !== 'admin') {
                    batch.delete(doc.ref);
                }
            });
            await batch.commit();
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'users');
    }
};

export const validateConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

export const saveListToFirestore = async (storeId: string, userId: string, listName: string, items: any[]) => {
  if (!storeId || !userId) throw new Error("Mã kho và User ID là bắt buộc.");
  
  const listsRef = collection(db, 'stores', storeId, 'savedLists');
  const newListRef = doc(listsRef);
  
  try {
    await setDoc(newListRef, {
      id: newListRef.id,
      name: listName,
      userId,
      storeId,
      createdAt: new Date().toISOString(),
      items: JSON.stringify(items),
      totalItems: items.length
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `stores/${storeId}/savedLists`);
  }
};

export const fetchSavedListsFromFirestore = async (storeId: string): Promise<any[]> => {
  if (!storeId) return [];
  
  const listsRef = collection(db, 'stores', storeId, 'savedLists');
  try {
    const q = query(listsRef);
    const snapshot = await getDocs(q);
    
    const lists = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        items: JSON.parse(data.items || '[]')
      };
    });
    
    return lists.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `stores/${storeId}/savedLists`);
    return [];
  }
};

export const deleteSavedListFromFirestore = async (storeId: string, listId: string) => {
  if (!storeId || !listId) throw new Error("Mã kho và List ID là bắt buộc.");
  
  const listRef = doc(db, 'stores', storeId, 'savedLists', listId);
  try {
    await deleteDoc(listRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `stores/${storeId}/savedLists/${listId}`);
  }
};

export const saveUserState = async (userId: string, state: { displayedProducts: any[], inventoryFilters: any }) => {
  if (!userId) return;
  
  const stateRef = doc(db, 'users', userId, 'state', 'current');
  try {
    await setDoc(stateRef, {
      displayedProducts: JSON.stringify(state.displayedProducts),
      inventoryFilters: JSON.stringify(state.inventoryFilters),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error saving user state:", error);
    // Silent fail for state sync to not interrupt UX
  }
};

export const fetchUserState = async (userId: string): Promise<{ displayedProducts: any[], inventoryFilters: any } | null> => {
  if (!userId) return null;
  
  const stateRef = doc(db, 'users', userId, 'state', 'current');
  try {
    const docSnap = await getDocs(query(collection(db, 'users', userId, 'state')));
    const currentDoc = docSnap.docs.find(d => d.id === 'current');
    
    if (currentDoc && currentDoc.exists()) {
      const data = currentDoc.data();
      return {
        displayedProducts: JSON.parse(data.displayedProducts || '[]'),
        inventoryFilters: JSON.parse(data.inventoryFilters || '{}')
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user state:", error);
    return null;
  }
};
