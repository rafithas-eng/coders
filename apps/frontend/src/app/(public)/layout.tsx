export default function PublicLayout(props:any) {
    return (<div className="border-4 border-green-500 p-4">
        {props.children}
    </div>
    ); 
}