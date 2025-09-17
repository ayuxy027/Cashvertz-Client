import { createContext, useContext, useState, ReactNode } from 'react'

interface AppContextType {
    mobileNumber: string
    setMobileNumber: (number: string) => void
    isReturningUser: boolean
    setIsReturningUser: (value: boolean) => void
    selectedAddress: string
    setSelectedAddress: (address: string) => void
    selectedItem: string
    setSelectedItem: (item: string) => void
    uploadedScreenshot: boolean
    setUploadedScreenshot: (value: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider')
    }
    return context
}

interface AppProviderProps {
    children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
    const [mobileNumber, setMobileNumber] = useState('')
    const [isReturningUser, setIsReturningUser] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState('')
    const [selectedItem, setSelectedItem] = useState('')
    const [uploadedScreenshot, setUploadedScreenshot] = useState(false)

    return (
        <AppContext.Provider
            value={{
                mobileNumber,
                setMobileNumber,
                isReturningUser,
                setIsReturningUser,
                selectedAddress,
                setSelectedAddress,
                selectedItem,
                setSelectedItem,
                uploadedScreenshot,
                setUploadedScreenshot,
            }}
        >
            {children}
        </AppContext.Provider>
    )
}
