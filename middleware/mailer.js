const ejs = require('ejs')
const path = require('path')


const mailSender = async (templateName, data) => {
    try {

        const templatePath = path.join(__dirname, "/views", templateName)
        const file = await ejs.renderFile(templatePath, data)
        return html;
        
    } catch (error) {
        console.error('Error rendering template:', error);
        throw error;
        
        
    }
}

module.exports= mailSender