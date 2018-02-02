module.exports = {
    "extends": "airbnb",
    "env": { node: true },
    "rules":
        {
            "semi":[2,"always"],
            "space-before-blocks":2,
            "no-trailing-spaces": [1, { "skipBlankLines": true,"ignoreComments": true }],
            "indent":[0,"tab"],
            "no-mixed-spaces-and-tabs": [1, "smart-tabs"],
            "no-tabs":0,
            "eol-last":0,
            "space-before-function-paren":0,
            "eqeqeq":0
        }
};