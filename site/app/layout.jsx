import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import 'nextra-theme-docs/style.css'
import { Banner } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'

export const metadata = {
}

const banner = <Banner>Nextra 4.0 is released 🎉</Banner>
const navbar = (
    <Navbar
        logo={<b>Licensify</b>}
    // ... Your additional navbar options
    />
)
const footer = <Footer>MIT {new Date().getFullYear()} © Nextra.</Footer>

export default async function RootLayout({ children }) {
    return (
        <html
            lang="en"
            dir="ltr"
            suppressHydrationWarning
        >
            <body>
                <Layout
                    banner={banner}
                    navbar={navbar}
                    pageMap={await getPageMap()}
                    docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
                    footer={footer}
                // ... Your additional layout options
                >
                    {children}
                </Layout>
            </body>
        </html>
    )
}
