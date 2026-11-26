'use client';
import ResetFilters from '../components/ResetFilters';
import FormModal from '../components/FormModal';
import {useEffect,useState} from 'react';
import {useStore} from '../../lib/store';
import {money,type Expense} from '../../lib/demo';

const categories=['Restaurant','Foto / Video','Muzică / DJ','Flori / Decor','Ținute','Ceremonie','Transport','Invitații','Altele'];
const emptyForm={name:'',amount:'',category:'Altele',date:'',notes:''};
type FormState=typeof emptyForm;
export default function BudgetPanel({quickAdd=0}:{quickAdd?:number}){
 const {data,setData,can}=useStore();
 const [form,setForm]=useState<FormState>(emptyForm);
 const [showForm,setShowForm]=useState(false);
 useEffect(()=>{if(quickAdd)setShowForm(true)},[quickAdd]);

 const [editing,setEditing]=useState<string|null>(null);
 const [categoryFilter,setCategoryFilter]=useState('all');
 const [sort,setSort]=useState('date');
 const [search,setSearch]=useState('');
 const writable=can('expenses','write');
 const readable=can('expenses','read');
 if(!readable)return <section className="panel"><p>Nu ai acces la buget.</p></section>;
 const expenses=data.expenses;
 const total=expenses.reduce((sum,item)=>sum+item.amount,0);
 const remaining=data.wedding.budget-total;
 const byCategory=categories.map(category=>({category,total:expenses.filter(e=>(e.category||'Altele')===category).reduce((sum,e)=>sum+e.amount,0)})).filter(item=>item.total>0).sort((a,b)=>b.total-a.total);
 const filtered=expenses.filter(e=>(categoryFilter==='all'||(e.category||'Altele')===categoryFilter)&&e.name.toLocaleLowerCase('ro').includes(search.toLocaleLowerCase('ro'))).sort((a,b)=>sort==='amount'?b.amount-a.amount:sort==='name'?a.name.localeCompare(b.name,'ro'):(b.date||'').localeCompare(a.date||''));
 const change=(key:keyof FormState,value:string)=>setForm(old=>({...old,[key]:value}));
 const reset=()=>{setShowForm(false);setForm(emptyForm);setEditing(null)};
 const edit=(e:Expense)=>{setShowForm(true);setEditing(e.id);setForm({name:e.name,amount:String(e.amount),category:e.category||'Altele',date:e.date||'',notes:e.notes||''})};
 const save=(event:React.FormEvent)=>{event.preventDefault();if(!writable)return;const amount=Number(form.amount);if(!form.name.trim()||!Number.isFinite(amount)||amount<=0)return;
 const next:Expense={id:editing||crypto.randomUUID(),name:form.name.trim().slice(0,160),amount,category:form.category,date:form.date||undefined,notes:form.notes.trim().slice(0,500)||undefined};
 setData(old=>({...old,expenses:editing?old.expenses.map(e=>e.id===editing?next:e):[...old.expenses,next]}));reset();
 };
 return <section className="panel"><div className="module-head"><h2>Buget și cheltuieli</h2>{writable&&<button type="button" className="button" onClick={()=>{reset();setShowForm(true)}}>+ Înregistrează cheltuială</button>}</div><p>Înregistrează doar plățile efective. Valorile contractelor din Furnizori sunt evidențiate separat.</p>
 <div className="stats"><article><span>Buget estimat</span><strong>{money(data.wedding.budget)}</strong></article><article><span>Cheltuit</span><strong>{money(total)}</strong></article><article><span>{remaining<0?'Depășire buget':'Buget rămas'}</span><strong>{money(Math.abs(remaining))}</strong></article><article><span>Procent utilizat</span><strong>{data.wedding.budget>0?Math.round(total/data.wedding.budget*100)+'%':'—'}</strong></article></div>
 {remaining<0&&<p className="v09-warning">⚠ Bugetul a fost depășit cu {money(-remaining)}.</p>}
 <h3>Cheltuieli pe categorii</h3>{byCategory.length?byCategory.map(item=><div className="budget-category" key={item.category}><div className="list-row"><span>{item.category}</span><strong>{money(item.total)}</strong></div><div className="progress"><span style={{width:(total?item.total/total*100:0)+'%'}}/></div></div>):<p>Nu există cheltuieli înregistrate.</p>}
 <h3>Registrul cheltuielilor</h3><details className="lux-filter-disclosure"><summary>Filtre și căutare{search||categoryFilter!=='all'||sort!=='date'? <span className="lux-filter-active">Active</span>:null}</summary><div className="task-filters"><label>Caută<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Denumire"/></label><label>Categorie<select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">Toate categoriile</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>Sortare<select value={sort} onChange={e=>setSort(e.target.value)}><option value="date">Data (recentă)</option><option value="amount">Valoare (descrescător)</option><option value="name">Denumire</option></select></label></div></details><ResetFilters active={!!search||categoryFilter!=='all'||sort!=='date'} onReset={()=>{setSearch('');setCategoryFilter('all');setSort('date')}}/>
 {filtered.length===0&&<div className="lux-empty"><div><strong>{expenses.length?"Niciun rezultat":"Registrul este gol"}</strong><small>{expenses.length?"Modifică filtrele pentru a vedea alte cheltuieli.":"Înregistrează prima plată pentru a urmări bugetul."}</small></div></div>}
 {filtered.map(e=><div className="list-row" key={e.id}><div><strong>{e.name}</strong><small>{e.category||'Altele'}{e.date?' · '+new Date(e.date+'T12:00:00').toLocaleDateString('ro-RO'):''}</small>{e.notes&&<p className="hint">{e.notes}</p>}{e.vendorPaymentId&&<small>Plată sincronizată din Furnizori · modifică din istoricul furnizorului</small>}</div><div className="budget-entry-actions"><strong>{money(e.amount)}</strong>{writable&&!e.vendorPaymentId&&<div className="row-controls"><button className="text-button" type="button" onClick={()=>edit(e)}>Editează</button><button className="remove" type="button" aria-label={'Șterge '+e.name} onClick={()=>{if(window.confirm('Ștergi cheltuiala „'+e.name+'”?')){setData(old=>({...old,expenses:old.expenses.filter(x=>x.id!==e.id)}));if(editing===e.id)reset()}}}>×</button></div>}</div></div>)}
 {writable&&showForm&&<FormModal title={editing?'Editează cheltuiala':'Adaugă cheltuială'} onClose={reset}><form onSubmit={save} className="budget-form"><div className="two"><label>Denumire<input required maxLength={160} value={form.name} onChange={e=>change('name',e.target.value)}/></label><label>Sumă (RON)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>change('amount',e.target.value.replace(/^0+(?=\d)/,''))}/></label><label>Categorie<select value={form.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label>Data plății (opțional)<input type="date" value={form.date} onChange={e=>change('date',e.target.value)}/></label></div><label>Note (opțional)<input maxLength={500} value={form.notes} onChange={e=>change('notes',e.target.value)}/></label><div className="actions"><button className="button" type="submit">{editing?'Salvează modificările':'Adaugă cheltuială'}</button><button className="button secondary" type="button" onClick={reset}>Anulează</button></div></form></FormModal>}
 </section>;
}
