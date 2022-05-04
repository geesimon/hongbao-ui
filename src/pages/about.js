import * as React from 'react'
import Layout from '../components/layout'

const AboutPage = () => {
  console.log("Layout:", Layout)
  return (
    <Layout pageTitle="Home Page">
      <p>This is about page. Hello</p>
    </Layout>
  )
}

export default AboutPage